import { z } from "zod";

export const serialSchema = z.object({
  serial_number: z.string().min(1, "يجب إدخال السيريال"),
});

export const purchaseInvoiceItemSchema = z.object({
  material_id: z.coerce.number(),
  name: z.string().optional(),
  is_serialized: z.any().optional(),
  quantity: z.coerce.number().min(1, "الكمية مطلوبة"),
  unit_price: z.coerce.number().min(0, "السعر مطلوب"),
  serials: z.array(
    z.object({ serial_number: z.string().min(1, "مطلوب") })
  ).optional().nullable()
});

export const purchaseInvoiceSchema = z.object({
  supplier_id: z.coerce.number().min(1, "يجب اختيار المورد"),
  supplier_invoice_number: z.any().optional(),
  invoice_date: z.any().optional(),
  
  items: z.array(z.any()).min(1, "يجب إضافة صنف واحد على الأقل"),
  
  discount: z.coerce.number().catch(0),
  paid_amount: z.coerce.number().catch(0),
  
  safe_id: z.any().optional(),
  account_id: z.any().optional(),
  notes: z.any().optional(),
});

export type PurchaseInvoiceFormValues = z.infer<typeof purchaseInvoiceSchema>;