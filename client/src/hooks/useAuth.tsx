import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, LoginRequest } from "@shared/schema";

interface SessionResponse {
  authenticated: boolean;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  logout: () => void;
  recheckSession: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: sessionData, isLoading, error, refetch } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5분
  });

  // 세션이 만료되었을 때 자동으로 로그아웃
  useEffect(() => {
    if (error && sessionData?.authenticated) {
      console.log("Session expired, logging out");
      logout();
    }
  }, [error, sessionData]);

  const recheckSession = () => {
    refetch();
  };

  const logout = () => {
    apiRequest("POST", "/api/auth/logout", {})
      .catch(error => console.error("Logout error:", error))
      .finally(() => {
        queryClient.setQueryData(["/api/auth/session"], { authenticated: false });
      });
  };

  const value = {
    user: sessionData?.authenticated ? sessionData.user || null : null,
    logout,
    recheckSession,
    isLoading,
    isAuthenticated: sessionData?.authenticated || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
