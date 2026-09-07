"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Banknote,
  CalendarDays,
  Wallet,
  CreditCard,
  CheckCircle2,
  XCircle,
  ArrowDownLeft,
  ReceiptText,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generatePaymentsPDF } from "@/lib/pdf/paymentsPdf";

interface Payment {
  id: number;
  amount: string | number;
  payment_method: string;
  notes: string;
  created_at: string;
  safe_name: string;
}

interface InvoicePaymentsModalProps {
  invoice: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoicePaymentsModal({
  invoice,
  isOpen,
  onClose,
}: InvoicePaymentsModalProps) {
  const [isPrinting, setIsPrinting] = React.useState(false);

  if (!invoice) return null;

  const totalAmount = Number(invoice.total_amount || 0);
  const paidAmount = Number(invoice.paid_amount || 0);
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);
  const payments: Payment[] = Array.isArray(invoice.payments)
    ? invoice.payments
    : [];

  const isFullyPaid = remainingAmount <= 0;

  const handlePrint = async () => {
    if (isPrinting) return;

    try {
      setIsPrinting(true);
      await generatePaymentsPDF(invoice);
    } catch (error) {
      console.error("Failed to generate payments PDF:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        dir="rtl"
        className={cn(
          "fixed",
          "inset-x-0",
          "top-0",
          "translate-x-0",
          "translate-y-0",
          "w-full",
          "h-[100dvh]",
          "max-w-none",
          "rounded-none",
          "p-0",
          "gap-0",
          "overflow-hidden",
          "flex",
          "flex-col",
          "bg-slate-50",
          "border-slate-200",
          "shadow-2xl",
          "sm:inset-x-auto",
          "sm:left-1/2",
          "sm:right-auto",
          "sm:top-1/2",
          "sm:-translate-x-1/2",
          "sm:-translate-y-1/2",
          "sm:w-[calc(100%-2rem)]",
          "sm:max-w-[600px]",
          "sm:h-auto",
          "sm:max-h-[90dvh]",
          "sm:rounded-2xl"
        )}
      >
        <DialogHeader className="shrink-0 p-4 sm:p-5 bg-white border-b border-slate-200 text-right">
          <div className="flex min-w-0 items-start gap-3 pr-8 sm:pr-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
              <ReceiptText className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex flex-wrap items-center gap-2 leading-6">
                <span>سجل الدفعات</span>

                <span className="max-w-full truncate text-slate-600 font-mono text-xs bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                  {invoice.invoice_ref || "-"}
                </span>
              </DialogTitle>

              <DialogDescription className="text-slate-500 text-[11px] sm:text-xs font-medium leading-5">
                تفاصيل التحصيلات المالية المرتبطة بهذه الفاتورة
              </DialogDescription>
            </div>
          </div>

          <div
            className={cn(
              "mt-4",
              "px-3 py-1.5",
              "rounded-full",
              "text-xs font-bold",
              "border shadow-sm",
              "flex items-center gap-1.5",
              "w-fit",
              isFullyPaid
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            )}
          >
            {isFullyPaid ? (
              <CheckCircle2 size={14} />
            ) : (
              <Wallet size={14} />
            )}

            <span>{isFullyPaid ? "خالصة" : "يوجد متبقي"}</span>
          </div>
        </DialogHeader>

        <div
          className={cn(
            "flex-1",
            "min-h-0",
            "w-full",
            "overflow-y-auto",
            "overflow-x-hidden",
            "overscroll-contain",
            "bg-slate-50",
            "touch-pan-y"
          )}
        >
          <div className="w-full p-4 sm:p-5 space-y-6 pb-8">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="min-w-0 bg-white p-2 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                <span className="text-[9px] sm:text-xs text-slate-500 mb-1 font-bold whitespace-nowrap">
                  إجمالي الفاتورة
                </span>

                <p className="text-xs sm:text-lg font-black text-slate-900 truncate w-full">
                  {totalAmount.toLocaleString()}
                </p>

                <span className="text-[8px] sm:text-[10px] text-slate-400 font-medium">
                  ج.م
                </span>
              </div>

              <div className="min-w-0 bg-emerald-50/50 p-2 sm:p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-center items-center text-center">
                <span className="text-[9px] sm:text-xs text-emerald-600 mb-1 font-bold whitespace-nowrap">
                  المدفوع
                </span>

                <p className="text-xs sm:text-lg font-black text-emerald-700 truncate w-full">
                  {paidAmount.toLocaleString()}
                </p>

                <span className="text-[8px] sm:text-[10px] text-emerald-500 font-medium">
                  ج.م
                </span>
              </div>

              <div
                className={cn(
                  "min-w-0",
                  "p-2 sm:p-4",
                  "rounded-xl",
                  "border shadow-sm",
                  "flex flex-col justify-center items-center text-center",
                  remainingAmount > 0
                    ? "bg-rose-50/50 border-rose-100"
                    : "bg-slate-50 border-slate-100"
                )}
              >
                <span
                  className={cn(
                    "text-[9px] sm:text-xs mb-1 font-bold whitespace-nowrap",
                    remainingAmount > 0
                      ? "text-rose-600"
                      : "text-slate-500"
                  )}
                >
                  المتبقي
                </span>

                <p
                  className={cn(
                    "text-xs sm:text-lg font-black truncate w-full",
                    remainingAmount > 0
                      ? "text-rose-700"
                      : "text-slate-700"
                  )}
                >
                  {remainingAmount.toLocaleString()}
                </p>

                <span
                  className={cn(
                    "text-[8px] sm:text-[10px] font-medium",
                    remainingAmount > 0
                      ? "text-rose-500"
                      : "text-slate-400"
                  )}
                >
                  ج.م
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                <ArrowDownLeft
                  size={16}
                  className="text-slate-400 shrink-0"
                />

                <span>حركات التحصيل المسجلة</span>
              </h3>

              {payments.length === 0 ? (
                <div className="bg-white border border-slate-200 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Banknote
                      size={24}
                      className="text-slate-300"
                    />
                  </div>

                  <p className="text-sm font-bold text-slate-600">
                    لا توجد دفعات مسجلة
                  </p>

                  <p className="text-xs text-slate-400 mt-1 leading-5">
                    لم يتم تسجيل أي تحصيلات مالية لهذه الفاتورة حتى الآن.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment, index) => (
                    <div
                      key={payment.id || index}
                      className={cn(
                        "w-full",
                        "min-w-0",
                        "bg-white",
                        "p-3.5 sm:p-4",
                        "rounded-xl",
                        "border border-slate-200",
                        "shadow-sm",
                        "flex flex-col sm:flex-row",
                        "sm:items-center sm:justify-between",
                        "gap-3 sm:gap-4"
                      )}
                    >
                      <div className="flex min-w-0 items-start sm:items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10",
                            "rounded-full",
                            "flex items-center justify-center",
                            "shrink-0",
                            "border",
                            payment.payment_method === "CASH"
                              ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                              : "bg-blue-50 border-blue-100 text-blue-600"
                          )}
                        >
                          {payment.payment_method === "CASH" ? (
                            <Banknote size={18} />
                          ) : (
                            <CreditCard size={18} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-800">
                              {payment.payment_method === "CASH"
                                ? "دفع نقدي (كاش)"
                                : "تحويل إلكتروني"}
                            </span>

                            <span className="max-w-[150px] truncate text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {payment.safe_name || "خزنة رئيسية"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
                            <CalendarDays
                              size={12}
                              className="text-slate-400 shrink-0"
                            />

                            <span
                              dir="ltr"
                              className="text-xs whitespace-nowrap"
                            >
                              {new Date(
                                payment.created_at
                              ).toLocaleString("en-GB", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>

                          {payment.notes && (
                            <p className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block max-w-full break-words mt-1">
                              {payment.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className={cn(
                          "flex items-center justify-between",
                          "sm:flex-col sm:items-end sm:justify-center",
                          "border-t sm:border-t-0",
                          "border-slate-100",
                          "pt-3 sm:pt-0",
                          "shrink-0",
                          "w-full sm:w-auto"
                        )}
                      >
                        <span className="text-[11px] font-bold text-slate-400 sm:hidden">
                          المبلغ المستلم:
                        </span>

                        <div className="flex items-baseline gap-1">
                          <span className="text-base sm:text-lg font-black text-emerald-700 font-mono whitespace-nowrap">
                            +{Number(payment.amount || 0).toLocaleString()}
                          </span>

                          <span className="text-[10px] font-bold text-emerald-600/70 sm:hidden">
                            ج.م
                          </span>
                        </div>

                        <span className="text-[10px] font-bold text-emerald-600/70 hidden sm:block">
                          ج.م
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-200 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto h-11 sm:h-10 px-6 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center justify-center gap-2 border border-slate-200 active:scale-[0.98]"
            >
              <XCircle size={16} />
              <span>إغلاق السجل</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className={cn(
                "w-full sm:w-auto",
                "h-11 sm:h-10",
                "px-6",
                "rounded-xl",
                "text-sm font-bold",
                "bg-slate-900 text-white",
                "hover:bg-slate-800",
                "transition-all",
                "flex items-center justify-center gap-2",
                "shadow-sm",
                "active:scale-[0.98]",
                "disabled:opacity-60",
                "disabled:cursor-not-allowed"
              )}
            >
              <Printer size={16} />

              <span>
                {isPrinting ? "جاري تجهيز الطباعة..." : "طباعة الكشف"}
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
