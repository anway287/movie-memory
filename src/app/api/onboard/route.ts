import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  movie: z
    .string()
    .trim()
    .min(1, "Movie title is required")
    .max(200, "Movie title must be 200 characters or fewer"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prevent re-onboarding
  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboarded: true },
  });
  if (existing?.onboarded) {
    return NextResponse.json({ error: "Already onboarded" }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { favoriteMovie: parsed.data.movie, onboarded: true },
  });

  return NextResponse.json({ success: true });
}
