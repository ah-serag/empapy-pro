import { z } from "zod";

export const createInvoiceSchema = z.object({
  subtotal: z.coerce.number().min(1, "subtotal is required").max(10000000 , "max 10 millon"),
    
  discount:   z.coerce.number().max(10000000 , "max 10 millon").optional().default(0),
    
  notes: z.string().optional(),
})
.superRefine((data, ctx) => {
    if (data.subtotal <= data.discount) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "يجب ان تكون قيمه الخصم اقل ",
            path: ["discount"]
        });
    }
 })
 ;

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;