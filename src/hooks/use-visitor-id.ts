"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const VISITOR_ID_KEY = "adulting-os-visitor-id";

/**
 * Hook to get a persistent visitor ID.
 * This allows us to identify users without requiring authentication.
 * The ID is stored in localStorage and persists across sessions.
 */
export function useVisitorId(): string | null {
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    // Check if we already have a visitor ID
    let id = localStorage.getItem(VISITOR_ID_KEY);
    
    if (!id) {
      // Generate a new one
      id = uuidv4();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    
    setVisitorId(id);
  }, []);

  return visitorId;
}

