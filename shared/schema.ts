import { z } from "zod";

// User schema matching Django Employee model
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  role: z.enum(['ENGINEER', 'MANAGER']),
  created_at: z.string(),
  updated_at: z.string(),
});

export type User = z.infer<typeof userSchema>;

// Login request schema
export const loginSchema = z.object({
  username: z.string().min(1, "사용자명을 입력해주세요"),
});

export type LoginRequest = z.infer<typeof loginSchema>;

// Update role request schema
export const updateRoleSchema = z.object({
  role: z.enum(['ENGINEER', 'MANAGER']),
});

export type UpdateRoleRequest = z.infer<typeof updateRoleSchema>;

// System stats schema
export const systemStatsSchema = z.object({
  totalUsers: z.number(),
  activeSessions: z.number(),
  systemStatus: z.string(),
});

export type SystemStats = z.infer<typeof systemStatsSchema>;

// Request Submission schema
export const requestSubmissionSchema = z.object({
  id: z.number(),
  department: z.string(),
  title: z.string(),
  content: z.string(),
  submitted_by: z.string(),
  submitted_at: z.string(),
  line_id: z.string().nullable(),
  ppid: z.string().nullable(),
  eqpid: z.string().nullable(),
  change_request_items: z.string().nullable(),
  status: z.string(),
  assignee: z.string().nullable(),
});

export type RequestSubmission = z.infer<typeof requestSubmissionSchema>;