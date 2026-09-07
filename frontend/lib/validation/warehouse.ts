import * as z from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().min(2, { message: 'الاسم يجب أن يكون حرفين على الأقل' }),
  parent_id: z.string().optional(),
});

export const materialSchema = z.object({
  name: z.string().min(2, { message: 'اسم الصنف مطلوب (حرفين على الأقل)' }),
  sku: z.string().min(1, { message: 'كود الصنف (SKU) مطلوب' }),
  category_id: z.coerce.number().min(1, { message: 'يجب اختيار القسم' }),
  
  current_cost: z.coerce.number().min(0, { message: 'التكلفة لا يمكن أن تكون بالسالب' }),
  current_price: z.coerce.number().min(0, { message: 'سعر البيع لا يمكن أن يكون بالسالب' }),
  
  unit: z.string().min(1, { message: 'وحدة القياس مطلوبة (مثال: قطعة، متر)' }),
  
  is_serialized: z.boolean().default(false),
  is_active: z.boolean().default(true),
});
export type MaterialFormValues = z.infer<typeof materialSchema>
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;