const { z } = require('zod');

const createSafeSchema = z.object({
  name: z.string().min(2).max(255),
  type: z.enum(["MAIN", "BANK", "TECHNICIAN_WALLET"]),
  user_id: z.number().int().positive().optional().nullable(),
  is_active: z.boolean().optional().default(true)
}).refine(data => {
  if (data.type === 'TECHNICIAN_WALLET' && !data.user_id) return false;
  return true;
}, { message: "يجب اختيار الفني لإنشاء عهدة فنيين", path: ["user_id"] });

const updateSafeStatusSchema = z.object({
  is_active: z.boolean()
});

module.exports = {
  createSafeSchema,
  updateSafeStatusSchema
};