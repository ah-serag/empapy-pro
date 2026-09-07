import * as z from "zod";

export const registerSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(11, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});


export const teamMemberSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters").max(40 , "max 40 charecters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(11, "Phone number must be at least 10 digits").max(11 , "max 11 "),
  password: z.string().min(6, "Password must be at least 6 characters").max(25 , "max 25 characters"),
  role: z.string().min(3, "role require")

});


export type TeamMemberFormValues = z.infer<typeof teamMemberSchema>;

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type SignInFormValues = z.infer<typeof signInSchema>;