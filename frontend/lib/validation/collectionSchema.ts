import { z } from "zod";

export const remitCollectionSchema = z.object({
  account_id: z.string().min(1, "يجب اختيار حساب استلام العهدة"),
  
  target_safe_id: z.string().min(1, "يجب اختيار الخزنة المستهدفة"),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  notes: z.string().optional(),
});

export type RemitCollectionFormValues = z.infer<typeof remitCollectionSchema>;