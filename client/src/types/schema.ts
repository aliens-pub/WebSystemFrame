import { z } from "zod";

export interface User {
  id: number;
  username: string;
  role: "MANAGER" | "ENGINEER";
  createdAt: Date;
}

export const loginSchema = z.object({
  username: z.string().min(1, "이름을 입력해주세요"),
});

export const updateRoleSchema = z.object({
  userId: z.number(),
  role: z.enum(["MANAGER", "ENGINEER"]),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type UpdateRoleRequest = z.infer<typeof updateRoleSchema>;