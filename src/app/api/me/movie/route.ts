import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UpdateMovieResponse } from "@/lib/api";

const schema = z.object({
  movie: z
    .string()
    .trim()
    .min(1, "Movie title is required")
    .max(200, "Movie title must be 200 characters or fewer"),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { movie } = parsed.data;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { favoriteMovie: movie },
    select: { favoriteMovie: true },
  });

  return NextResponse.json({
    favoriteMovie: updated.favoriteMovie!,
  } satisfies UpdateMovieResponse);
}
