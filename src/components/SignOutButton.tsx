"use client";

import { signOutAction } from "@/app/actions";

export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-lg border border-gray-700 hover:border-gray-600 px-4 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800/80 transition-all"
      >
        Sign out
      </button>
    </form>
  );
}
