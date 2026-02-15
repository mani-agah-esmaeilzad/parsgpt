import { z } from "zod";

export const chatRequestSchema = z.object({
  conversationId: z.string().cuid().optional(),
  gptId: z.string().cuid().optional(),
  userMessage: z.string().min(1, "پیام نمی‌تواند خالی باشد").optional(),
  regenerate: z.boolean().optional(),
});

export const conversationCreateSchema = z.object({
  gptId: z.string().cuid(),
});

export const conversationUpdateSchema = z.object({
  title: z.string().trim().min(2).max(120),
});

export const gptUpsertSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  icon: z.string().max(16).optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  systemPrompt: z.string().min(10),
  starterPrompts: z.array(z.string()).default([]),
  model: z.string().min(2),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(1),
  maxOutputTokens: z.number().min(128).max(8192).optional().nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  enabled: z.boolean().default(true),
});

export const userRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export const reportQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const reportDaysSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const reportExportSchema = reportDaysSchema.extend({
  type: z.enum(["daily", "user", "gpt"]).default("daily"),
});

export const adminUsersQuerySchema = z.object({
  q: z.string().optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export const adminAuditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  actionType: z.string().optional(),
});

export const searchSchema = z.object({
  q: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const signUpSchema = z.object({
  phone: z.string().min(5),
});
