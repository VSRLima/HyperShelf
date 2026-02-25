"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/app/client-providers";
import AppErrorBoundary from "@/components/shared/error/AppErrorBoundary";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClerkProvider>
      <Providers>
        <AppErrorBoundary>{children}</AppErrorBoundary>
      </Providers>
    </ClerkProvider>
  );
}
