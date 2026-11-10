export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboarded: true },
  });

  if (user?.onboarded) redirect("/dashboard");

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />

      <div className="relative w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gray-800/80 border border-white/10 text-4xl mx-auto shadow-xl">
            🎬
          </div>
          <h1 className="text-3xl font-bold">
            Welcome, <span className="gradient-text">{firstName}</span>!
          </h1>
          <p className="text-gray-400">
            What&apos;s your all-time favorite movie?
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  );
}
