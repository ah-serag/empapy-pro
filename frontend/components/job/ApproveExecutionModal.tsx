import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Loader2, Banknote, CreditCard, Calculator, BookOpen, Ban } from "lucide-react";
import { toast } from "sonner";
import AccountSelect from "../treasury/AccountSelect";
import CompanySafeSelect from "../treasury/CompanySafeSelect";
import { cn } from "@/lib/utils";

export interface ApprovePayload {
  execution_id: string | number;
  account_id?: number | null;
  safe_id?: number | null;
  invoice_amount: number;
  discount: number;
  collected_amount: number;
  supervisor_id: number;
  date: string;
}

interface ApproveExecutionModalProps {
  execution: any;
  grandTotal: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: ApprovePayload) => Promise<void>;
  onReject?: (execution_id: number) => Promise<void>; 
  isLoading?: boolean;
}

export default function ApproveExecutionModal({ 
  execution, 
  grandTotal, 
  isOpen, 
  onClose, 
  onConfirm,
  onReject,
  isLoading = false 
}: ApproveExecutionModalProps) {
  const [accountId, setAccountId] = useState<string>("");
  const [safeId, setSafeId] = useState<string>(""); 
  
  const [invoiceAmount, setInvoiceAmount] = useState<string>(grandTotal.toString());
  const [discount, setDiscount] = useState<string>("0");
  
  const [collectedAmount, setCollectedAmount] = useState<string>((execution.collected_amount || 0).toString());

  const isTransfer = execution.payment_method === "TRANSFER";
  const isCash = execution.payment_method === "CASH";
  const isNone = !isCash && !isTransfer;
  
  const hasCollection = Number(collectedAmount) > 0;

  const handleSubmit = async () => {
    if (Number(invoiceAmount) < 0 || Number(discount) < 0 || Number(collectedAmount) < 0) {
      toast.error("لا يمكن إدخال قيم مالية بالسالب.");
      return;
    }
    if (!execution.supervisor_id) {
      toast.error("خطأ: لا يوجد مشرف محدد لهذه المهمة لتحمل العهدة.");
      return;
    }
    
    // التحقق الصارم: الكاش والتحويل يحتاجان بند محاسبي طالما هناك مبلغ محصل
    if ((isCash || isTransfer) && hasCollection && !accountId) {
      toast.error("يرجى اختيار البند المحاسبي (شجرة الحسابات) لتوجيه الإيراد.");
      return;
    }
    // التحقق الصارم: التحويل يحتاج إلى خزنة طالما هناك مبلغ محصل
    if (isTransfer && hasCollection && !safeId) {
      toast.error("يرجى اختيار خزنة/محفظة الشركة التي تم الإيداع فيها.");
      return;
    }

    const payload: ApprovePayload = {
      execution_id: execution.id || execution.execution_id,
      account_id: (isCash || isTransfer) && hasCollection ? Number(accountId) : null,
      safe_id: isTransfer && hasCollection ? Number(safeId) : null,
      invoice_amount: Number(invoiceAmount),
      discount: Number(discount),
      collected_amount: Number(collectedAmount), // 🔴 إرسال القيمة المعدلة للباك إند
      supervisor_id: execution.supervisor_id,
      date: new Date().toISOString(),
    };

    await onConfirm(payload);
  };

  const handleReject = async () => {
    if (!onReject) return;
    const confirmReject = window.confirm("هل أنت متأكد من رفض هذه المهمة وإعادتها للفني؟");
    if (confirmReject) {
      await onReject(execution.id || execution.execution_id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent 
        className="sm:max-w-lg p-0 bg-white border-slate-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]" 
        dir="rtl"
      >
        <DialogHeader className="p-5 bg-primary border-b border-slate-100 shrink-0">
          <DialogTitle className="text-lg font-normal text-slate-200 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="text-secondary" size={18} />
            </div>
            اعتماد وإقفال المهمة
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 overflow-y-auto space-y-5 bg-white flex-1 min-h-0">
          
          {/* 1. المراجعة المالية */}
          <div className="border border-slate-200 rounded-xl p-4 shadow-sm bg-slate-50/50">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/60">
              <Calculator size={16} className="text-slate-500" />
              <h3 className="text-sm font-bold text-slate-800">المراجعة المالية</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">إجمالي السيستم المبدئي</label>
                <div className="h-10 px-3 flex items-center bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-bold text-sm cursor-not-allowed">
                  {grandTotal} ج.م
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">الخصم (إن وجد)</label>
                <div className="relative">
                  <input 
                    type="number" min="0" disabled={isLoading}
                    value={discount} onChange={(e) => setDiscount(e.target.value)}
                    className="w-full h-10 px-3 pl-10 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">ج.م</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">قيمة الفاتورة الفعلية</label>
                <div className="relative">
                  <input 
                    type="number" min="0" disabled={isLoading}
                    value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full h-10 px-3 pl-10 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">ج.م</span>
                </div>
              </div>
              
              {/* 🔴 المحصل الفعلي أصبح Input قابل للتعديل */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">المحصل الفعلي</label>
                <div className="relative">
                  <input 
                    type="number" min="0" disabled={isLoading}
                    value={collectedAmount} onChange={(e) => setCollectedAmount(e.target.value)}
                    className="w-full h-10 px-3 pl-10 bg-white border border-slate-200 rounded-lg text-emerald-700 font-bold text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">ج.م</span>
                </div>
              </div>

            </div>
          </div>

          <div className="space-y-4">
            
            {/* 🔴 التوجيه المحاسبي: يظهر في حالة الكاش والتحويل فقط لو فيه مبلغ محصل */}
            {(isCash || isTransfer) && hasCollection && (
              <div className="border border-slate-200 rounded-xl p-4 shadow-sm bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-secondary" />
                  <h3 className="text-sm font-bold text-slate-800">التوجيه المحاسبي للإيراد <span className="text-rose-500">*</span></h3>
                </div>
                <AccountSelect 
                  value={accountId} onChange={setAccountId} disabled={isLoading}
                  placeholder="اختر بند الإيرادات من شجرة الحسابات..."
                />
              </div>
            )}

            {/* 🔴 الخزنة: تظهر في حالة التحويل فقط وفقط لو فيه مبلغ محصل */}
            {isTransfer && hasCollection && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-indigo-200 flex items-center justify-center shrink-0 shadow-sm">
                    <CreditCard className="text-indigo-600" size={16} />
                  </div>
                  <div className="pt-0.5">
                    <h4 className="text-xs font-bold text-indigo-900 mb-1">توجيه الخزينة / البنك <span className="text-rose-500">*</span></h4>
                    <p className="text-[11px] text-indigo-700/80 leading-relaxed font-medium">
                      يرجى تحديد خزنة أو محفظة الشركة التي استلمت التحويل لإتمام المطابقة.
                    </p>
                  </div>
                </div>
                <CompanySafeSelect 
                  value={safeId} onChange={setSafeId} disabled={isLoading}
                  placeholder="اختر محفظة الإيداع أو بنك الشركة..."
                />
              </div>
            )}

            {/* 🔴 رسالة الكاش (توضيح فقط للمشرف) */}
            {isCash && hasCollection && (
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shrink-0 shadow-sm">
                  <Banknote className="text-emerald-600" size={16} />
                </div>
                <div className="pt-0.5">
                  <h4 className="text-xs font-bold text-emerald-900 mb-1">التحصيل نقداً (عهدة الفني)</h4>
                  <p className="text-[11px] text-emerald-700/80 leading-relaxed font-medium">
                    لا يتطلب توجيه خزنة هنا. سيتم تسجيل هذا المبلغ مباشرة كعهدة في حساب الفني المشرف.
                  </p>
                </div>
              </div>
            )}

            {/* 🔴 الآجل: في حال كان المحصل صفر بغض النظر عن طريقة الدفع */}
            {!hasCollection && (
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center shrink-0 shadow-sm">
                  <AlertCircle className="text-amber-600" size={16} />
                </div>
                <div className="pt-0.5">
                  <h4 className="text-xs font-bold text-amber-900 mb-1">لا يوجد تحصيل فوري</h4>
                  <p className="text-[11px] text-amber-700/90 leading-relaxed font-medium">
                    المحصل الفعلي صفر. سيتم إصدار الفاتورة وتُسجل كمديونية آجلة على حساب العميل (لا يتطلب توجيه حسابات أو خزائن).
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shrink-0">


          <div className="flex items-center gap-2 w-full sm:w-auto">
     
            
            <button 
              type="button" 
              onClick={handleSubmit}
              disabled={isLoading}
              className={cn(
                "w-full sm:w-auto h-9 px-6 rounded-lg text-sm font-bold text-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95",
                isLoading ? "bg-slate-400 cursor-not-allowed" : "bg-secondary hover:bg-secondary/90"
              )}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>{isLoading ? "جاري الحفظ..." : "تأكيد الإقفال"}</span>
            </button>

                   <button 
              type="button" 
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto h-9 px-5 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
            >
              إلغاء
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}