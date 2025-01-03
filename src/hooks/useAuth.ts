'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export function useAuth() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const createUser = async () => {
      if (user) {
        try {
          await fetch('/api/auth', {
            method: 'POST',
          });
        } catch (error) {
          console.error('Error creating user:', error);
        }
      }
    };

    if (isLoaded && user) {
      createUser();
    }
  }, [isLoaded, user]);

  return { user, isLoaded };
}