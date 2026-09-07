import { z } from "zod";

export const invoicePaymentSchema = z.object({
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  safe_id: z.any().refine((val) => val !== undefined && val !== "", { message: "يجب اختيار الخزنة" }),
  account_id: z.any().refine((val) => val !== undefined && val !== "", { message: "يجب اختيار البند المحاسبي" }),
  notes: z.string().optional(),
});

export type InvoicePaymentFormValues = z.infer<typeof invoicePaymentSchema>;