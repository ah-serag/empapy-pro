"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowDownToLine, ArrowUpFromLine, Save, FileText, Wallet, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateVoucherMutation } from '@/redux/features/treasurySafesApiSlice';
import CompanySafeSelect from '@/components/treasury/CompanySafeSelect';
import AccountSelect from '@/components/treasury/AccountSelect';

const voucherSchema = z.object({
  voucher_type: z.enum(['RECEIPT', 'PAYMENT']),
  safe_id: z.string().min(1, { message: "يرجى اختيار الخزنة المرتبطة" }),
  account_id: z.string().min(1, { message: "يرجى اختيار البند المحاسبي للتوجيه" }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "المبلغ يجب أن يكون أكبر من الصفر",
  }),
  party_type: z.enum(['CUSTOMER', 'SUPPLIER', 'EMPLOYEE', 'TECHNICIAN', 'OTHER']),
  description: z.string().min(3, { message: "البيان يجب أن يحتوي على 3 أحرف على الأقل لتوضيح الحركة" }),
});

type VoucherForm = z.infer<typeof voucherSchema>;

export default function CreateVoucherPage() {
  const [createVoucher, { isLoading: isSubmitting }] = useCreateVoucherMutation();
  const [activeTab, setActiveTab] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT');

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<VoucherForm>({
    resolver: zodResolver(voucherSchema),
    mode: 'onChange',
    defaultValues: {
      voucher_type: 'RECEIPT',
      safe_id: "",
      account_id: "",
      amount: "",
      party_type: 'OTHER',
      description: ""
    }
  });

  const onSubmit = async (data: VoucherForm) => {
    try {
      const payload = {
        ...data,
        safe_id: Number(data.safe_id),
        account_id: Number(data.account_id),
        amount: parseFloat(data.amount)
      };
      await createVoucher(payload).unwrap();
      toast.success(data.voucher_type === 'RECEIPT' ? "تم تسجيل سند القبض بنجاح" : "تم تسجيل سند الصرف بنجاح");
      reset({ amount: "", description: "", party_type: 'OTHER', safe_id: "", account_id: "" });
    } catch (error: any) {
      toast.error(error?.data?.message || "حدث خطأ أثناء تسجيل السند");
    }
  };

  return (
    <div className="max-w-dvw mx-auto p-3 sm:p-6 md:p-8" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-primary p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner shrink-0">
            <FileText size={28} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-wide">إصدار سند مالي</h2>
            <p className="text-slate-400 text-sm mt-1.5 font-medium">تسجيل حركات القبض والصرف اليدوية والقيود العكسية</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8 bg-slate-50/50">
          
          {/* Tabs - متجاوبة: فوق بعض في الموبايل، وجنب بعض في الشاشات الأكبر */}
          <div className="flex flex-col sm:flex-row bg-slate-200/70 p-1.5 rounded-2xl gap-1.5 sm:gap-0">
            <button
              type="button"
              onClick={() => { setActiveTab('RECEIPT'); setValue('voucher_type', 'RECEIPT'); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-300",
                activeTab === 'RECEIPT' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:bg-slate-300/50"
              )}
            >
              <ArrowDownToLine size={20} /> سند قبض (استلام نقدية)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('PAYMENT'); setValue('voucher_type', 'PAYMENT'); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-300",
                activeTab === 'PAYMENT' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-slate-500 hover:bg-slate-300/50"
              )}
            >
              <ArrowUpFromLine size={20} /> سند صرف (دفع نقدية)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* الخزنة */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Wallet size={16} className="text-primary" /> الخزنة المرتبطة
              </label>
              <Controller
                name="safe_id"
                control={control}
                render={({ field }) => (
                  <div className={cn("rounded-xl overflow-hidden", errors.safe_id && "ring-2 ring-red-500/50")}>
                    <CompanySafeSelect 
                      value={String(field.value)} 
                      onChange={field.onChange} 
                      disabled={isSubmitting}
                      placeholder="اختر محفظة الإيداع أو بنك الشركة..."
                    />
                  </div>
                )}
              />
              {errors.safe_id && <p className="text-xs font-bold text-red-500">{errors.safe_id.message}</p>}
            </div>

            {/* البند المحاسبي */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Tags size={16} className="text-primary" /> البند المحاسبي (التوجيه)
              </label>
              <Controller
                name="account_id"
                control={control}
                render={({ field }) => (
                  <div className={cn("rounded-xl overflow-hidden", errors.account_id && "ring-2 ring-red-500/50")}>
                    <AccountSelect 
                      value={String(field.value)} 
                      onChange={field.onChange} 
                      disabled={isSubmitting}
                      placeholder={activeTab === 'RECEIPT' ? "اختر بند الإيرادات من شجرة الحسابات..." : "اختر بند المصروفات من شجرة الحسابات..."}
                    />
                  </div>
                )}
              />
              {errors.account_id && <p className="text-xs font-bold text-red-500">{errors.account_id.message}</p>}
            </div>

            {/* المبلغ */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">المبلغ</label>
              <div className="relative">
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <input 
                      {...field} 
                      type="number" 
                      step="any"
                      placeholder="0.00" 
                      className={cn(
                        "w-full h-14 px-5 pl-15  mt-3 text-2xl font-mono font-bold bg-white border-2 rounded-xl outline-none transition-all", 
                        errors.amount ? "border-red-500 focus:border-red-500 text-red-700 ring-2 ring-red-500/20" :
                        (activeTab === 'RECEIPT' ? "focus:border-emerald-500 text-emerald-700 border-emerald-100" : "focus:border-rose-500 text-rose-700 border-rose-100")
                      )} 
                    />
                  )}
                />
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">ج.م</span>
              </div>
              {errors.amount && <p className="text-xs font-bold text-red-500">{errors.amount.message}</p>}
            </div>

            {/* جهة التعامل */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">جهة التعامل (اختياري)</label>
              <Controller
                name="party_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} dir='rtl' onValueChange={field.onChange} disabled={isSubmitting}>
                    <SelectTrigger className="w-full h-24 p-7 mt-2 bg-white border-slate-200 rounded-xl text-sm font-medium">
                      <SelectValue placeholder="اختر جهة التعامل..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="OTHER">أخرى (عام)</SelectItem>
                      <SelectItem value="TECHNICIAN">فني</SelectItem>
                      <SelectItem value="EMPLOYEE">موظف</SelectItem>
                      <SelectItem value="SUPPLIER">مورد</SelectItem>
                      <SelectItem value="CUSTOMER">عميل</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.party_type && <p className="text-xs font-bold text-red-500">{errors.party_type.message}</p>}
            </div>

          </div>

          {/* البيان */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">البيان / سبب السند (إجباري)</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea 
                  {...field} 
                  placeholder="اكتب تفاصيل السند بدقة لتوضيح الحركة في التقارير (مثال: سداد نقدية لعهدة الفني...)" 
                  className={cn(
                    "w-full h-32 p-5 mt-3 bg-white border-2 rounded-xl text-sm font-medium outline-none resize-none transition-all leading-relaxed",
                    errors.description ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  )}
                  disabled={isSubmitting}
                ></textarea>
              )}
            />
            {errors.description && <p className="text-xs font-bold text-red-500">{errors.description.message}</p>}
          </div>

          {/* Submit */}
          <div className="pt-4 pb-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={cn(
                "w-full h-16 sm:h-14 rounded-2xl font-bold text-base sm:text-lg text-white flex justify-center items-center gap-3 transition-all duration-300 shadow-xl active:scale-[0.98]",
                isSubmitting ? "bg-slate-300 shadow-none text-slate-500 cursor-not-allowed" : 
                (activeTab === 'RECEIPT' ? "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/30" : "bg-rose-600 hover:bg-rose-700 hover:shadow-rose-600/30")
              )}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={24} /> 
              ) : (
                <Save size={24} />
              )}
              {activeTab === 'RECEIPT' ? 'تأكيد واعتماد سند القبض' : 'تأكيد واعتماد سند الصرف'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}