export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";
import SignOutButton from "@/components/SignOutButton";
import Image from "next/image";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, favoriteMovie: true, onboarded: true },
  });

  if (!user) redirect("/");
  if (!user.onboarded) redirect("/onboarding");

  const displayName = user.name ?? "Movie Fan";
  const initials = displayName[0].toUpperCase();

  return (
    <main className="min-h-screen px-4 py-10">
      {/* Subtle background */}
      <div className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none fixed top-0 right-0 h-96 w-96 rounded-full bg-violet-600/8 blur-3xl -z-10" />

      <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
        {/* Header card */}
        <div className="flex items-center justify-between rounded-2xl bg-gray-900/80 border border-white/8 p-5 card-glow backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {user.image ? (
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 blur-sm opacity-50 scale-110" />
                <Image
                  src={user.image}
                  alt={displayName}
                  width={48}
                  height={48}
                  className="relative rounded-full ring-2 ring-white/10"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-600 to-sky-500 flex items-center justify-center text-xl font-bold shadow-lg">
                {initials}
              </div>
            )}
            <div>
              <p className="font-semibold text-white">{displayName}</p>
              <p className="text-sm text-gray-400">{user.email ?? "No email"}</p>
            </div>
          </div>
          <SignOutButton />
        </div>

        {/* Client-side interactive section */}
        <DashboardClient initialMovie={user.favoriteMovie ?? ""} />
      </div>
    </main>
  );
}
