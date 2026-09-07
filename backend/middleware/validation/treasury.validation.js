import { z } from 'zod';

export const createSafeSchema = z.object({
  name: z.string({ required_error: "اسم الخزنة مطلوب" })
    .min(2, "اسم الخزنة يجب أن يكون حرفين على الأقل")
    .max(255, "اسم الخزنة طويل جداً"),
    
  type: z.enum(["MAIN", "BANK", "TECHNICIAN_WALLET"], {
    required_error: "نوع الخزنة مطلوب",
    invalid_type_error: "نوع الخزنة غير صالح. يجب أن يكون MAIN, BANK, أو TECHNICIAN_WALLET",
  }),
  
  user_id: z.number().int().positive().optional().nullable(),
}).refine(data => {
  // أمان إضافي: لو الخزنة عهدة فني، لازم يبعت الـ user_id
  if (data.type === 'TECHNICIAN_WALLET' && !data.user_id) {
    return false;
  }
  return true;
}, { 
  message: "يجب اختيار الفني لإنشاء عهدة فنيين", 
  path: ["user_id"] 
});

export const createAccountSchema = z.object({
  code: z.string({ required_error: "كود الحساب مطلوب" })
    .min(2, "كود الحساب قصير جداً")
    .max(50, "كود الحساب طويل جداً"),
    
  name: z.string({ required_error: "اسم الحساب مطلوب" })
    .min(2, "اسم الحساب يجب أن يكون حرفين على الأقل")
    .max(255, "اسم الحساب طويل جداً"),
    
  type: z.enum(["REVENUE", "EXPENSE"], {
    required_error: "يجب تحديد نوع الحساب (إيراد أو مصروف)",
    invalid_type_error: "نوع الحساب غير صالح",
  }),
});