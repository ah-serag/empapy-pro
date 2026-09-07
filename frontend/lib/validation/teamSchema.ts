import { z } from "zod";

export const teamSchema = z.object({
  name: z.string().min(2, { message: "Team name must be at least 2 characters" }).max(40 ,{ message: "Team name must less 40 characters" }),

  team_type: z.string().min(1, { message: "Please select a team type" }),

  governorate_id: z
    .number()
    .min(1, { message: "Please select a governorate" }),

  zone_id: z
    .number()
    .min(1, { message: "Please select a zone" }),

  supervisor_id: z
    .number()
    .min(1, { message: "Please select a supervisor" }),

  max_daily_tasks: z
    .number()
    .min(1, { message: "Must be at least 1 task" }),

  notes: z.string().optional(),

  is_active: z.boolean(),
});

export const teamMemberSchema = z.object({
  user_id: z
    .number()
    .min(1, { message: "Please select a user" }),

  role_in_team: z.string().min(1, {
    message: "Please select a role",
  }),

  joined_at: z.string().min(1, {
    message: "Join date is required",
  }),
});

export type TeamFormValues = z.infer<typeof teamSchema>;
export type TeamMemberFormValues = z.infer<typeof teamMemberSchema>;