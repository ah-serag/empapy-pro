import { z } from "zod";

export const createAccountSchema = z.object({
  code: z.string().min(1, "كود الحساب مطلوب").max(50, "كود الحساب طويل جداً"),
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(255, "الاسم طويل جداً"),
  type: z.string().min(1, "الرجاء اختيار نوع الحساب"),
});

export type CreateAccountFormValues = z.infer<typeof createAccountSchema>;