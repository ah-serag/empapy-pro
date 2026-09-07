"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Ban, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useRejectExecutionMutation } from "@/redux/features/JobExecutionApiSlice"; 
import { cn } from "@/lib/utils";

interface RejectExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  executionId: string | number | null | undefined; 
  bookingRef?: string;
}

export default function RejectExecutionModal({
  isOpen,
  onClose,
  executionId,
  bookingRef,
}: RejectExecutionModalProps) {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  
  const [rejectExecution, { isLoading }] = useRejectExecutionMutation();

  const REQUIRED_CONFIRMATION_TEXT = "تأكيد الرفض";

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setConfirmText("");
    }
  }, [isOpen]);

  const isReasonValid = reason.trim().length >= 5;
  const isConfirmed = confirmText.trim() === REQUIRED_CONFIRMATION_TEXT;
  const hasValidId = executionId !== null && executionId !== undefined && String(executionId).trim() !== "";
  
  const canSubmit = isReasonValid && isConfirmed && hasValidId && !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit) {
       if (!hasValidId) toast.error("خطأ تقني: معرف المهمة مفقود.");
       return;
    }

    try {
      await rejectExecution({
        execution_id: executionId,
        rejection_reason: reason.trim(),
      }).unwrap();

      toast.success("تم رفض المهمة وإعادتها للفني بنجاح.");
      onClose();
    } catch (error: any) {
      console.error("Reject Execution Error:", error);
      toast.error(error?.data?.message || error?.message || "حدث خطأ أثناء رفض المهمة.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        aria-describedby={undefined}
        className="w-[95vw] sm:max-w-[500px] p-0 bg-white border-slate-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col" 
        dir="rtl"
      >
        <DialogHeader className="p-5 sm:p-6 bg-primary border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border flex items-center justify-center shrink-0">
              <Ban size={20} className="text-rose-900" />
            </div>
            <div>
              <DialogTitle className=" sm:text-lg font-normal text-slate-100 flex items-center gap-2">
                رفض المهمة وإعادتها للتعديل
                {bookingRef && (
                  <span className="text-primary font-mono text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {bookingRef}
                  </span>
                )}
              </DialogTitle>
              <p className="text-slate-100 text-[11px] sm:text-xs mt-0.5 font-medium">
                سيتم إرجاع هذه المهمة للفني لتعديل الأخطاء وإعادة الإرسال.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-5 bg-slate-50/50">
          
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
              سبب الرفض والملاحظات <span className="text-rose-500">*</span>
            </label>
            <textarea
              placeholder="اكتب بوضوح الأخطاء التي يجب على الفني تعديلها (الخامات، المبالغ، الصور...)"
              className="w-full h-24 p-3 text-sm bg-white border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {reason.length > 0 && !isReasonValid && (
              <p className="text-[10px] text-rose-500 font-medium">الرجاء كتابة سبب واضح وتفصيلي (5 أحرف على الأقل).</p>
            )}
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-slate-800">تأكيد الإجراء لمنع الأخطاء</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  هذا الإجراء سيوقف عملية الاعتماد ويعيد المهمة للفني. للتأكيد، يرجى كتابة عبارة 
                  <span className="font-bold text-rose-600 bg-rose-50 px-1.5 mx-1 rounded whitespace-nowrap">تأكيد الرفض</span>
                  في الحقل أدناه.
                </p>
              </div>
            </div>

            <input
              type="text"
              placeholder="اكتب 'تأكيد الرفض' هنا..."
              className={cn(
                "w-full p-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none transition-all text-center font-bold placeholder:font-normal",
                isConfirmed 
                  ? "border-emerald-500 bg-emerald-50/30 text-emerald-700 focus:border-emerald-500 focus:ring-emerald-500/20" 
                  : "border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
              )}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>

        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto h-10 px-5 rounded-xl text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <XCircle size={16} /> <span>إلغاء وتراجع</span>
          </button>

          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "w-full sm:w-auto h-10 px-6 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm",
              canSubmit 
                ? "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
            )}
          >
            <Ban size={16} /> 
            <span>{isLoading ? "جاري التنفيذ..." : "تأكيد ورفض المهمة"}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}