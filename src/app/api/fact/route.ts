import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FactResponse } from "@/lib/api";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { favoriteMovie: true },
  });

  if (!user?.favoriteMovie) {
    return NextResponse.json(
      { error: "No favorite movie set" },
      { status: 400 }
    );
  }

  const { favoriteMovie } = user;

  // Check for a recently stored fact (last one for this user+movie)
  const latestFact = await prisma.fact.findFirst({
    where: { userId: session.user.id, movie: favoriteMovie },
    orderBy: { createdAt: "desc" },
  });

  // Generate a fresh fact from OpenAI
  let content: string;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Give me one short, interesting, and lesser-known fun fact about the movie "${favoriteMovie}". Keep it to 1-2 sentences.`,
        },
      ],
      max_tokens: 150,
    });
    content = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!content) throw new Error("Empty response from OpenAI");
  } catch (err) {
    // Graceful fallback: return cached fact if available
    if (latestFact) {
      return NextResponse.json({
        id: latestFact.id,
        content: latestFact.content,
        movie: latestFact.movie,
        cached: true,
        createdAt: latestFact.createdAt.toISOString(),
      } satisfies FactResponse);
    }
    const isQuotaError = (err as { status?: number })?.status === 429;
    console.error("OpenAI error:", err);
    return NextResponse.json(
      {
        error: isQuotaError
          ? "OpenAI quota exceeded — add billing credits at platform.openai.com to enable facts."
          : "Could not generate a fact right now. Please try again later.",
      },
      { status: 503 }
    );
  }

  // Persist the new fact
  const fact = await prisma.fact.create({
    data: {
      userId: session.user.id,
      movie: favoriteMovie,
      content,
    },
  });

  return NextResponse.json({
    id: fact.id,
    content: fact.content,
    movie: fact.movie,
    cached: false,
    createdAt: fact.createdAt.toISOString(),
  } satisfies FactResponse);
}
