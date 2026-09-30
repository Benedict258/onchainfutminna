import { z } from "zod";

const skills = [
  "Solidity",
  "Move",
  "Rust",
  "JavaScript",
  "Python",
  "Frontend Dev",
  "UI/UX Design",
  "Content Writing",
  "Marketing",
  "Community Management",
  "Research",
  "Other",
] as const;

const levels = ["100", "200", "300", "400", "500", "600"] as const;
const experienceLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^\+?[1-9]\d{1,14}$/, "Enter a valid phone number (e.g. +2348012345678)"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    dateOfBirth: z
      .string()
      .regex(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])$/, "Date must be DD-MM"),
    department: z.string().min(1, "Department is required"),
    level: z.enum(levels, { required_error: "Level is required" }),
    skills: z.array(z.enum(skills)).min(1, "Select at least one skill"),
    experienceLevel: z.enum(experienceLevels, {
      required_error: "Experience level is required",
    }),
    funFact: z.string().optional(),
    xLink: z.string().optional().or(z.literal("")),
    githubLink: z.string().optional().or(z.literal("")),
    portfolioLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or username is required")
    .refine(
      (val) =>
        val.includes("@")
          ? z.string().email().safeParse(val).success
          : /^[a-zA-Z0-9_]{3,}$/.test(val),
      { message: "Please enter a valid email or username" },
    ),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(1).optional().or(z.literal("")),
  nickname: z.string().max(30).optional(),
  department: z.string().min(1).optional(),
  level: z.enum(levels).optional(),
  skills: z.array(z.enum(skills)).optional(),
  experienceLevel: z.enum(experienceLevels).optional(),
  funFact: z.string().optional(),
  bio: z.string().max(500).optional(),
  username: z
    .string()
    .min(3)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional()
    .or(z.literal("")),
  xLink: z.string().optional().or(z.literal("")),
  githubLink: z.string().optional().or(z.literal("")),
  portfolioLink: z.string().url().optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
