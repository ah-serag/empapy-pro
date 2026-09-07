"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Settings2, Percent, Coins, LayoutList } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpsertServiceCommissionMutation } from "@/redux/features/serviceCommissionApiSlice";

interface ServiceCommissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: any | null; 
}

export default function ServiceCommissionModal({ open, onOpenChange, service }: ServiceCommissionModalProps) {
  const [upsertCommission, { isLoading: isSubmitting }] = useUpsertServiceCommissionMutation();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      commission_type: "",
      pool_value: "",
    }
  });

  const selectedType = watch("commission_type");

  useEffect(() => {
    if (open && service) {
      reset({
        commission_type: service.commission_type || "FIXED_PER_UNIT", 
        pool_value: service.pool_value ? service.pool_value.toString() : "",
      });
    }
  }, [open, service, reset]);

  const onSubmit = async (data: any) => {
    if (!service?.id) {
      toast.error("حدث خطأ: معرف الخدمة مفقود.");
      return;
    }

    if (!data.commission_type || !data.pool_value) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة.");
      return;
    }

    const numericValue = Number(data.pool_value);
    if (isNaN(numericValue) || numericValue < 0) {
      toast.error("يرجى إدخال قيمة مالية أو نسبة صحيحة (يجب أن تكون رقماً موجباً).");
      return;
    }

    try {
      await upsertCommission({
        service_id: service.id,
        commission_type: data.commission_type,
        pool_value: numericValue,
      }).unwrap();

      toast.success("تم تحديث وحفظ وعاء عمولة الفريق لهذه الخدمة بنجاح.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "حدث خطأ أثناء حفظ الإعدادات.");
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "PERCENTAGE": return <Percent size={16} className="text-indigo-500" />;
      case "FIXED_PER_UNIT": return <LayoutList size={16} className="text-emerald-500" />;
      case "FIXED_PER_JOB": return <Coins size={16} className="text-amber-500" />;
      default: return <Settings2 size={16} className="text-slate-400" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        // 🔴 التعديل السحري: تحديد أقصى ارتفاع، العرض الآمن للموبايل، وتفعيل Flex Layout
        className="sm:max-w-[550px] w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col p-0 border-0 rounded-3xl bg-white shadow-2xl overflow-hidden mx-auto"
        dir="rtl"
      >
        {/* Header - ثابت ولا يتحرك */}
        <div className="bg-slate-900 px-6 py-5 shrink-0 z-10 text-right">
          <DialogTitle className="font-normal text-[18px] text-white flex items-center justify-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
              <Settings2 size={18} />
            </div>
            إعدادات عمولة الفريق
          </DialogTitle>
          <p className="text-[12px] text-slate-400 mt-1.5 pr-11 text-right">
            تحديد القيمة التي سيتم توزيعها على الفريق عند تنفيذ خدمة: 
            <span className="font-bold  text-white mr-1 m-5 px-2 py-0.5 bg-slate-800 rounded-md">
              {service?.name_ar || "..."}
            </span>
          </p>
        </div>

        {/* Form - 🔴 هنا يتم التمرير (Scroll) إذا كانت الشاشة صغيرة */}
        <form id="commission-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 bg-slate-50/50 flex-1 overflow-y-auto">
          
          {/* نوع العمولة */}
          <div className="space-y-2 text-right">
            <label className="block text-[13px] font-bold text-slate-700">
              طريقة حساب العمولة <span className="text-red-500">*</span>
            </label>
            <Select value={selectedType} onValueChange={(val) => setValue("commission_type", val)}>
              <SelectTrigger dir="rtl" className="rounded-xl px-4 py-7 text-right bg-white border-slate-200 h-14 text-[13px] font-bold focus:ring-slate-900/20 shadow-sm w-full">
                <SelectValue placeholder="اختر طريقة الحساب" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl" dir="rtl">
                
                <SelectItem value="FIXED_PER_UNIT" className="text-right py-3 focus:bg-slate-50">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <LayoutList size={14} className="text-emerald-500" />
                      مبلغ ثابت لكل وِحدة / كمية (موصى به)
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal pr-5">
                      يُضرب المبلغ في العدد. (مثال: صيانة جهازين = القيمة × 2)
                    </span>
                  </div>
                </SelectItem>
                
                <SelectItem value="PERCENTAGE" className="text-right py-3 focus:bg-slate-50">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <Percent size={14} className="text-indigo-500" />
                      نسبة مئوية (%) من إجمالي الخدمة
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal pr-5">
                      (مثال: 10% من سعر مقايسة النحاس بالفاتورة)
                    </span>
                  </div>
                </SelectItem>

                <SelectItem value="FIXED_PER_JOB" className="text-right py-3 focus:bg-slate-50">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <Coins size={14} className="text-amber-500" />
                      مبلغ ثابت للمهمة ككل
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal pr-5">
                      لا يُضرب في الكمية. (مثال: بدل زيارة أو معاينة)
                    </span>
                  </div>
                </SelectItem>

              </SelectContent>
            </Select>
          </div>

          {/* قيمة العمولة */}
          <div className="space-y-2 text-right">
            <label className="block text-[13px] font-bold text-slate-700">
              {selectedType === "PERCENTAGE" ? "النسبة المئوية (%)" : "المبلغ (ج.م)"} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-slate-100 p-1.5 rounded-md">
                {getIconForType(selectedType)}
              </div>
              <Input 
                {...register("pool_value")}
                type="number"
                step="0.01"
                min="0"
                placeholder={selectedType === "PERCENTAGE" ? "مثال: 10" : "مثال: 150"}
                className="rounded-xl bg-white border-slate-200 h-14 pr-[46px] pl-4 text-left font-mono text-[15px] font-bold focus-visible:ring-slate-900/20 shadow-sm transition-all" 
                dir="ltr"
              />
            </div>
          </div>

          {/* رسالة توضيحية للمستخدم */}
          {selectedType && (
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-right">
              <p className="text-[12px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">كيف سيتم الحساب؟</span><br />
                {selectedType === "PERCENTAGE" && "سيتم خصم هذه النسبة من إجمالي سعر الخدمة المُنفذة وتوزيعها على الفريق حسب حصص كل فرد."}
                {selectedType === "FIXED_PER_UNIT" && "سيتم ضرب هذا المبلغ في (الكمية/العدد) المُنفذ، ثم يتم توزيع الإجمالي على الفريق حسب حصص كل فرد."}
                {selectedType === "FIXED_PER_JOB" && "سيتم إعطاء هذا المبلغ مرة واحدة للفريق لتوزيعه بينهم، مهما كانت الكمية المنجزة."}
              </p>
            </div>
          )}

        </form>

        {/* Footer - ثابت ولا يتحرك */}
        <div className="bg-white border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="rounded-xl h-12 px-8 w-full sm:w-auto border-slate-200 text-slate-600 font-bold hover:bg-slate-50 shadow-sm order-2 sm:order-1"
          >
            إلغاء
          </Button>
          
          <Button 
            type="submit" 
            form="commission-form"
            disabled={isSubmitting} 
            className="rounded-xl h-12 px-10 bg-slate-900 text-white hover:bg-slate-800 font-bold w-full sm:w-auto shadow-md order-1 sm:order-2 transition-all active:scale-[0.98]"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري الحفظ...</>
            ) : "حفظ الإعدادات"}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}