import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: number, role: string): Promise<User | undefined>;
  getSystemStats(): Promise<{ totalUsers: number; activeSessions: number; systemStatus: string; }>;
}
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserRole(userId: number, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getSystemStats(): Promise<{ totalUsers: number; activeSessions: number; systemStatus: string; }> {
    const allUsers = await db.select().from(users);
    return {
      totalUsers: allUsers.length,
      activeSessions: Math.floor(allUsers.length * 0.7), // Mock active sessions
      systemStatus: "정상"
    };
  }
}

export const storage = new DatabaseStorage();