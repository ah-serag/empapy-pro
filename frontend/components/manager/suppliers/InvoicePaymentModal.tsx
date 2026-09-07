import React, { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Banknote, ShieldCheck, AlertCircle, ReceiptText, Wallet } from "lucide-react";

import CompanySafeSelect from "@/components/treasury/CompanySafeSelect"; 
import AccountSelect from "@/components/treasury/AccountSelect"; 
import { invoicePaymentSchema, InvoicePaymentFormValues } from "@/lib/validation/invoicePaymentSchema";
import { usePayPurchaseInvoiceMutation } from "@/redux/features/purchaseApiSlice";

interface InvoicePaymentModalProps {
  invoiceId: number;
  remainingAmount: number;
  invoiceRef: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InvoicePaymentModal({ invoiceId, remainingAmount, invoiceRef, open, onOpenChange }: InvoicePaymentModalProps) {

  const [payInvoice, { isLoading }] = usePayPurchaseInvoiceMutation();

  const { register, control, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(invoicePaymentSchema),
    defaultValues: {
      amount: remainingAmount, 
      safe_id: "",
      account_id: "", 
      notes: ""
    }
  });

  const watchAmount = Number(useWatch({ control, name: "amount" })) || 0;
  const watchSafeId = String(useWatch({ control, name: "safe_id" }) || "");
  const watchAccountId = String(useWatch({ control, name: "account_id" }) || "");

  useEffect(() => {
    if (open) {
      reset({ amount: remainingAmount, safe_id: "", account_id: "", notes: "" });
    }
  }, [open, remainingAmount, reset]);

  const onError = (formErrors: any) => {
    if (formErrors.safe_id) toast.error("تأكد من اختيار الخزنة.");
    else if (formErrors.account_id) toast.error("تأكد من اختيار البند المحاسبي.");
    else if (formErrors.amount) toast.error("تأكد من إدخال مبلغ صحيح.");
  };

  const onSubmit = async (data: InvoicePaymentFormValues) => {
    if (data.amount > remainingAmount) {
      return toast.error(`المبلغ لا يمكن أن يتجاوز المتبقي (${remainingAmount.toLocaleString()} ج)`);
    }

    try {
      await payInvoice({ id: invoiceId, data }).unwrap();
      toast.success("تم سداد الدفعة وتسجيلها بنجاح");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "حدث خطأ أثناء السداد");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[420px] w-[92vw] p-0 rounded-2xl border-0 bg-slate-50 shadow-2xl" 
        dir="rtl"
      >
        <ScrollArea className="max-h-[85vh] w-full rounded-2xl">
          
          {/* ================= Header Section ================= */}
          <div className="bg-slate-900 text-white p-6 sm:p-7 pb-10 relative text-right">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
            
            <div className="relative z-10">
              <DialogTitle className="flex items-center justify-start gap-2.5 text-xl font-bold tracking-tight">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Banknote className="text-emerald-400 w-5 h-5" />
                </div>
                سداد دفعة للمورد
              </DialogTitle>
              <p className="text-slate-400 text-[13px] mt-3 flex items-center justify-start gap-1.5">
                <ReceiptText size={14} className="opacity-70 shrink-0" />
                فاتورة رقم: <span className="font-mono font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded-md">{invoiceRef}</span>
              </p>

              <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 mt-5 border border-slate-700/50 flex justify-between items-center shadow-inner">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-slate-400 shrink-0" />
                  <span className="text-[13px] font-medium text-slate-300">المتبقي للدفع</span>
                </div>
                <span className="font-mono font-bold text-2xl text-emerald-400 drop-shadow-sm" dir="ltr">
                  {remainingAmount.toLocaleString()} ج
                </span>
              </div>
            </div>
          </div>

          {/* ================= Form Section ================= */}
          <form onSubmit={handleSubmit(onSubmit, onError)} className="p-5 sm:p-7 space-y-5 -mt-6 bg-slate-50 rounded-t-[2rem] relative z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">

            {/* حقل المبلغ */}
            <div className="space-y-2">
              <label className="block text-right text-[13px] font-bold text-slate-700">
                المبلغ المراد سداده الآن <span className="text-rose-500 mr-1">*</span>
              </label>
              <div className="relative group">
                <Input 
                  type="number" 
                  step="0.01" 
                  {...register("amount")}
                  className="h-14 pl-14 pr-4 text-start rounded-2xl text-xl  font-mono font-bold border-slate-200 bg-white shadow-sm focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
                  dir="rtl"
                />
                <div className="absolute left-1.5 top-1.5 bottom-1.5 flex items-center justify-center bg-slate-50 px-3 rounded-xl border border-slate-100 text-slate-500 font-bold text-[13px] shadow-sm">
                  ج.م
                </div>
              </div>
              {errors.amount && <p className="text-[11px] text-right text-rose-500 font-bold">{errors.amount.message as string}</p>}

              {watchAmount > remainingAmount && (
                <div className="flex items-start gap-2 mt-2 bg-rose-50 p-3 rounded-xl border border-rose-100 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-rose-700 font-bold leading-relaxed text-right">
                    تنبيه: المبلغ المدخل يتجاوز المديونية المتبقية لهذه الفاتورة!
                  </p>
                </div>
              )}
            </div>

            {/* حقل الخزنة */}
            <div className="space-y-2">
              <label className="block text-right text-[13px] font-bold text-slate-700">
                خزنة الصرف <span className="text-rose-500 mr-1">*</span>
              </label>
              <div className="bg-white rounded-2xl shadow-sm text-right">
                <CompanySafeSelect 
                  value={watchSafeId}
                  onChange={(val) => setValue("safe_id", String(val), { shouldValidate: true })}
                />
              </div>
            </div>

            {/* حقل البند المحاسبي */}
            <div className="space-y-2">
              <label className="block text-right text-[13px] font-bold text-slate-700">
                البند المحاسبي <span className="text-rose-500 mr-1">*</span>
              </label>
              <div className="bg-white rounded-2xl shadow-sm text-right">
                <AccountSelect 
                  value={watchAccountId}
                  onChange={(val) => setValue("account_id", String(val), { shouldValidate: true })}
                />
              </div>
            </div>

            {/* حقل الملاحظات */}
            <div className="space-y-2">
              <label className="block text-right text-[13px] font-bold text-slate-700">
                ملاحظات إضافية (اختياري)
              </label>
              <Textarea 
                {...register("notes")}
                placeholder="مثال: تحويل بنكي، دفعة نقدية..."
                className="h-20 rounded-2xl resize-none text-right text-[13px] border-slate-200 bg-white shadow-sm focus-visible:ring-primary/30 p-4 transition-all"
              />
            </div>

            {/* الأزرار */}
            <div className="pt-2 flex gap-3 pb-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-1/3 h-12 rounded-2xl text-[14px] text-slate-600 font-bold border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-800 transition-all"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || watchAmount <= 0 || watchAmount > remainingAmount}
                className="flex-1 h-12 rounded-2xl bg-primary text-white text-[14px] font-bold shadow-lg hover:shadow-primary/25 hover:bg-primary/95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 ml-2 opacity-90" />
                    تأكيد الدفع
                  </>
                )}
              </Button>
            </div>

          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}