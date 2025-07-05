import { apiRequest } from "./queryClient";

export const authApi = {
  async getCurrentUser() {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },

  async login(username: string) {
    const response = await apiRequest("POST", "/api/auth/login", { username });
    return response.json();
  },
};

// Custom fetch function that includes auth token
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("authToken");
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
}
