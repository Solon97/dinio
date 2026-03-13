"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import posthog from "posthog-js";
import apiClient from "@/libs/api";
import { UserData } from "@/libs/userService";

export type { UserData };

interface UserContextValue {
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data: UserData = await apiClient.get("/user");
      setUser(data);

      if (data && data.id) {
        posthog.identify(data.id, {
          email: data.email,
          has_access: data.isPremium,
        });
      }
    } catch (err) {
      // apiClient already handles 401 redirects to login
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao carregar dados do usuário");
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider
      value={{ user, isLoading, error, refetch: fetchUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
