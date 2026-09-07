import { z } from "zod";

export const approveExpenseSchema = z.object({
  account_id: z.string().min(1, "يجب اختيار تصنيف المصروف (شجرة الحسابات)"),
  
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  notes: z.string().optional(),
});

export type ApproveExpenseFormValues = z.infer<typeof approveExpenseSchema>;