export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SignInButton from "@/components/SignInButton";

export default async function Home() {
  const session = await auth();

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboarded: true },
    });
    redirect(user?.onboarded ? "/dashboard" : "/onboarding");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glow blobs */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 left-1/3 h-72 w-72 rounded-full bg-sky-600/10 blur-3xl" />

      <div className="relative w-full max-w-lg space-y-10 text-center animate-fade-in">
        {/* Logo */}
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gray-800/80 border border-white/10 text-5xl mx-auto shadow-xl">
          🎬
        </div>

        <div className="space-y-4 animate-fade-in-delay">
          <h1 className="text-5xl font-bold tracking-tight gradient-text pb-1">
            Movie Memory
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Sign in and discover fascinating, lesser-known facts<br />
            about the movies you love.
          </p>
        </div>

        <div className="animate-fade-in-delay-2">
          <SignInButton />
        </div>
      </div>
    </main>
  );
}
