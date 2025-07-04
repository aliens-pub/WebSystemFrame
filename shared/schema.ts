import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  role: text("role").notNull().default("ENGINEER"), // MANAGER or ENGINEER
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  role: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "이름을 입력해주세요"),
});

export const updateRoleSchema = z.object({
  userId: z.number(),
  role: z.enum(["MANAGER", "ENGINEER"]),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
export type UpdateRoleRequest = z.infer<typeof updateRoleSchema>;
