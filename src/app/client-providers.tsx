"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import type { ReactNode } from "react";

let convex: ConvexReactClient | null = null;

function getConvexClient() {
  if (!convex && process.env.NEXT_PUBLIC_CONVEX_URL) {
    convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  }
  return convex;
}

export function Providers({ children }: { children: ReactNode }) {
  const client = getConvexClient();
  
  if (!client) {
    return <>{children}</>;
  }
  
  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
