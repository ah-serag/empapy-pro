import { z } from 'zod';

export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(2, "اسم القسم يجب أن يكون حرفين على الأقل").max(100),
    parent_id: z.number().int().positive().nullable().optional(),
  }),
});

export const materialSchema = z.object({
  body: z.object({
    sku: z.string().min(3).max(100),
    name: z.string().min(3).max(255),
    category_id: z.number().int().positive(),
    is_serialized: z.boolean().default(false),
    current_cost: z.number().min(0, "التكلفة لا يمكن أن تكون بالسالب"),
    current_price: z.number().min(0, "السعر لا يمكن أن يكون بالسالب"),
    unit: z.string().max(50).default('قطعة'),
    is_active: z.boolean().default(true),
  }),
});

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    return res.status(400).json({ status: 'error', errors: err.errors });
  }
};