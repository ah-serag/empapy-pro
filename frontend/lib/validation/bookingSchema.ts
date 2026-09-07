// src/lib/validation/bookingSchema.ts
import * as z from "zod";

export const bookingSchema = z.object({
  contact_name: z.string().min(2, { message: "Name is required" }).max(40),
  contact_phone: z.string().min(11, { message: "Valid phone number is required" }).max(11),
  contact_email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
  address: z.string().min(5, { message: "Detailed address is required" }),
  preferred_date: z.date({ message: "Please select a date" }),
  notes: z.string().optional(),
  location_url : z.string().optional(),
  gov_id: z.number().min(1, { message: "Please select a governorate" }),
  zone_id: z.number().min(1, { message: "Please select a zone" }),
  source :  z.string()
});

export type BookingFormValues = z.infer<typeof bookingSchema>;