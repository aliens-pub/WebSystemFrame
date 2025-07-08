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
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("authToken")
  );
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: true, // 창 포커스 시에만 확인
    staleTime: Infinity, // 데이터를 stale로 간주하지 않음
    gcTime: Infinity, // 가비지 컬렉션 안함
  });

  // 세션이 만료되었을 때 자동으로 로그아웃
  useEffect(() => {
    if (error && token) {
      console.log("Session expired, logging out");
      logout();
    }
  }, [error, token]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem("authToken", data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  const login = async (data: LoginRequest) => {
    await loginMutation.mutateAsync(data);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("authToken");
    queryClient.clear();
  };

  // Token is automatically handled by apiRequest function

  const value = {
    user: (user as User) || null,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
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
