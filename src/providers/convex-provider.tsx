"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useEffect, useState } from "react";

// Create a singleton client
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Initialize client only if URL is provided
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // If Convex URL is not configured, render children without Convex
  // This allows the app to work without Convex during development
  if (!convex) {
    console.warn("Convex URL not configured. Running without Convex.");
    return <>{children}</>;
  }

  // Only render ConvexProvider on client side
  if (!isClient) {
    return null;
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

