import { z } from "zod";

export const invoicePaymentSchema = z.object({
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  payment_method: z.string().min(1, "يجب اختيار طريقة الدفع"),
  target_safe_id: z.string().min(1, "يجب اختيار الخزنة"),
  account_id: z.string().min(1, "يجب اختيار البند المحاسبي (الإيراد)"),
  notes: z.string().optional(),
});

export type InvoicePaymentFormValues = z.infer<typeof invoicePaymentSchema>;