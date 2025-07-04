import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, updateRoleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username } = loginSchema.parse(req.body);
      
      let user = await storage.getUserByUsername(username);
      
      if (!user) {
        // Create new user with default ENGINEER role
        user = await storage.createUser({ 
          username, 
          role: "ENGINEER" 
        });
      }
      
      // In a real app, you'd generate a JWT token here
      // For now, we'll just return user data
      res.json({ 
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        token: `mock-jwt-${user.id}` // Mock token for demo
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "로그인 중 오류가 발생했습니다" });
      }
    }
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token || !token.startsWith("mock-jwt-")) {
      return res.status(401).json({ message: "인증이 필요합니다" });
    }
    
    const userId = parseInt(token.replace("mock-jwt-", ""));
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: "사용자를 찾을 수 없습니다" });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      role: user.role
    });
  });

  // Get all users (for admin panel)
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      })));
    } catch (error) {
      res.status(500).json({ message: "사용자 목록을 가져오는 중 오류가 발생했습니다" });
    }
  });

  // Update user role (admin only)
  app.put("/api/admin/users/:id/role", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = updateRoleSchema.parse({ userId, role: req.body.role });
      
      const user = await storage.updateUserRole(userId, role);
      
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        role: user.role
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "권한 업데이트 중 오류가 발생했습니다" });
      }
    }
  });

  // Get system stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "통계 정보를 가져오는 중 오류가 발생했습니다" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
