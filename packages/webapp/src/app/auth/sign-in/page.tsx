// filepath: /packages/webapp/src/app/auth/sign-in/page.tsx
"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// lazy-load client-only sign in UI (no SSR)
const SignInClient = dynamic(() => import("@/components/auth/SignInClient"), { ssr: false });

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Suspense fallback={<div className="p-8">Loading…</div>}>
        <SignInClient />
      </Suspense>
    </main>
  );
}
