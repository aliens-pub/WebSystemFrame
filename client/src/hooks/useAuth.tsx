import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, LoginRequest } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Create a default user without requiring authentication
  const defaultUser: User = {
    id: 1,
    username: "사용자",
    role: "MANAGER",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Always return the default user as authenticated
  const user = defaultUser;
  const isLoading = false;

  const login = async (data: LoginRequest) => {
    // No-op since we don't need authentication
  };

  const logout = () => {
    // No-op since we don't need authentication
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: true, // Always authenticated
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
