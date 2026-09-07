import { z } from "zod";

export const createSafeSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(255, "الاسم طويل جداً"),
  type: z.string().min(1, "الرجاء اختيار نوع الخزنة"),
  user_id: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
}).superRefine((data, ctx) => {
  if (data.type === 'TECHNICIAN_WALLET' && !data.user_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "يجب اختيار المشرف المسؤول عن العهدة",
      path: ['user_id']
    });
  }
});

export type CreateSafeFormValues = z.infer<typeof createSafeSchema>;