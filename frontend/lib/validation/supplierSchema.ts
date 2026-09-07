import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(2, { message: "اسم المورد يجب أن يكون حرفين على الأقل" }),
  phone: z.string().optional().nullable(),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }).optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  tax_number: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;