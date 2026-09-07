import * as z from "zod"

export const governorateSchema = z.object({
  name_ar: z.string().min(2, "Arabic name is required"),
  name_en: z.string().min(2, "English name is required"),
  is_active: z.boolean().default(true),
})

export const zoneSchema = z.object({
  governorate_id: z.coerce
    .number()
    .min(1, "Please select a governorate"),

  name_ar: z.string().min(2, "Arabic name is required"),

  name_en: z.string().min(2, "English name is required"),

  notes: z.string().optional(),

  is_active: z.boolean().default(true),
})

export type GovernorateFormValues = z.infer<typeof governorateSchema>

export type ZoneFormValues = z.infer<typeof zoneSchema>

export type Zone = ZoneFormValues & {
  id: number
  created_at?: string
  governorate_name_en?: string
  governorate_name_ar?: string
}

export type Governorate = GovernorateFormValues & {
  id: number
  created_at?: string
  zones?: Zone[]
}