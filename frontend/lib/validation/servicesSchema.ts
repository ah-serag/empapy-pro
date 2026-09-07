import * as z from "zod"

export const categorySchema = z.object({
  name_ar: z.string().min(1, "Arabic name is required"),
  name_en: z.string().min(1, "English name is required"),
  icon: z.string().nullable().optional(),
  sort_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
})

export const serviceSchema = z.object({
  category_id: z.coerce.number().min(1, "Category is required"),
  name_ar: z.string().min(1, "Arabic name is required"),
  name_en: z.string().min(1, "English name is required"),
  base_price: z.coerce.number().default(0),
  duration_hours: z.coerce.number().default(1),
  is_active: z.boolean().default(true),
})

export type CategoryFormValues = z.input<typeof categorySchema>
export type CategoryData = z.output<typeof categorySchema>

export type ServiceFormValues = z.input<typeof serviceSchema>
export type ServiceData = z.output<typeof serviceSchema>

export type Service = ServiceData & {
  id: number
  created_at?: string
  updated_at?: string
}

export type Category = CategoryData & {
  id: number
  created_at?: string
  services?: Service[]
}