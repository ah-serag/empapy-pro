import { z } from 'zod';

export const completeAssignmentSchema = z.object({
  members: z.array(z.object({
    user_id: z.number(),
    name: z.string()
  })).min(1, { message: "يجب إضافة عضو واحد على الأقل" }),

  services: z.array(
    z.object({
      service_id: z.union([z.string(), z.number()]).refine(val => val !== "", { message: "يجب اختيار الخدمة" }),
      quantity: z.number().min(1, { message: "الكمية يجب أن تكون 1 على الأقل" })
    })
  )
  .min(1, { message: "يجب إضافة خدمة واحدة على الأقل" })
  .refine(
    (services) => {
      const selectedServices = services.filter(s => s.service_id !== "");
      const serviceIds = selectedServices.map(s => String(s.service_id));
      const uniqueIds = new Set(serviceIds);
      return uniqueIds.size === serviceIds.length;
    },
    { message: "لقد قمت باختيار هذه الخدمة مسبقاً! قم بزيادة الكمية بدلاً من إضافتها مرة أخرى." }
  )
});

export type CompleteAssignmentFormValues = z.infer<typeof completeAssignmentSchema>;