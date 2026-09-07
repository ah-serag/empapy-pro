"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRecordInvoicePaymentMutation } from "@/redux/features/invoicesApiSlice";
import {
  invoicePaymentSchema,
  InvoicePaymentFormValues,
} from "@/lib/validation/pushInvoicePaymentSchema";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Loader2,
  Banknote,
  Receipt,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import CompanySafeSelect from "@/components/treasury/CompanySafeSelect";
import AccountSelect from "@/components/treasury/AccountSelect";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  paidSoFar: number;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  invoice,
  paidSoFar,
}: RecordPaymentModalProps) {
  const t = useTranslations("invoicePayment");

  const [recordPayment, { isLoading }] =
    useRecordInvoicePaymentMutation();

  const totalAmount = Number(invoice?.total_amount || 0);
  const remainingAmount = Math.max(totalAmount - paidSoFar, 0);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(invoicePaymentSchema),
    defaultValues: {
      amount: remainingAmount > 0 ? remainingAmount : 0,
      payment_method: "CASH",
      target_safe_id: "",
      account_id: "",
      notes: "",
    },
  });

  const watchAmount = useWatch({
    control,
    name: "amount",
  });

  const watchSafe = useWatch({
    control,
    name: "target_safe_id",
  });

  const watchAccount = useWatch({
    control,
    name: "account_id",
  });

  useEffect(() => {
    if (!isOpen) return;

    reset({
      amount: remainingAmount > 0 ? remainingAmount : 0,
      payment_method: "CASH",
      target_safe_id: "",
      account_id: "",
      notes: "",
    });
  }, [isOpen, remainingAmount, reset]);

  const onSubmit = async (data: InvoicePaymentFormValues) => {
    const amount = Number(data.amount);

    if (amount > remainingAmount) {
      toast.error(
        "لا يمكن تحصيل مبلغ أكبر من المتبقي على الفاتورة."
      );
      return;
    }

    if (amount <= 0) {
      toast.error("يجب إدخال مبلغ صحيح.");
      return;
    }

    try {
      await recordPayment({
        id: invoice.invoice_id || invoice.id,
        data,
      }).unwrap();

      toast.success(
        "تم تسجيل الدفعة بنجاح وتحديث رصيد الخزنة."
      );

      onClose();
    } catch (err: any) {
      toast.error(
        err?.data?.message || "حدث خطأ أثناء التسجيل"
      );
    }
  };

  if (!invoice) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onClose();
        }
      }}
    >
      <DialogContent
        dir="rtl"
        className="
          fixed
          inset-0
          translate-x-0
          translate-y-0
          w-full
          h-[100dvh]
          max-w-none
          rounded-none
          p-0
          gap-0
          overflow-hidden
          border-0
          bg-slate-50
          shadow-2xl
          flex
          flex-col
          sm:left-1/2
          sm:top-1/2
          sm:right-auto
          sm:bottom-auto
          sm:-translate-x-1/2
          sm:-translate-y-1/2
          sm:w-[calc(100vw-2rem)]
          sm:max-w-[480px]
          sm:h-auto
          sm:max-h-[90dvh]
          sm:rounded-2xl
        "
      >
        <div className="shrink-0 bg-slate-900 text-white p-4 sm:p-6 relative">
          <div className="absolute inset-0 bg-emerald-500/10 opacity-20 pointer-events-none" />

          <DialogTitle className="relative z-10 flex min-w-0 items-center gap-3 text-base sm:text-lg pr-7 sm:pr-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center shadow-inner border border-white/10 shrink-0">
              <Banknote className="text-emerald-400 w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="font-normal min-w-0 flex-1">
              <span className="truncate block">
                {t("modalTitle")}
              </span>

              <div className="text-[11px] sm:text-[12px] font-medium text-slate-300 mt-0.5 flex items-center gap-1 min-w-0">
                <Receipt
                  size={12}
                  className="shrink-0"
                />

                <span className="truncate">
                  {t("invoiceRef")} {invoice.invoice_ref}
                </span>
              </div>
            </div>
          </DialogTitle>

          <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
            <div className="min-w-0 bg-slate-800/80 rounded-xl p-2.5 border border-slate-700 shadow-inner flex flex-col items-center text-center">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold mb-0.5 whitespace-nowrap">
                {t("totalAmount")}
              </span>

              <span className="font-mono font-bold text-xs sm:text-sm text-slate-200 truncate w-full">
                {totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="min-w-0 bg-emerald-900/60 rounded-xl p-2.5 border border-emerald-800 shadow-inner flex flex-col items-center text-center">
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold mb-0.5 whitespace-nowrap">
                {t("paidAmount")}
              </span>

              <span className="font-mono font-bold text-xs sm:text-sm text-emerald-300 truncate w-full">
                {paidSoFar.toLocaleString()}
              </span>
            </div>

            <div className="min-w-0 bg-white rounded-xl p-2.5 shadow-md flex flex-col items-center text-center border-2 border-emerald-500">
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold mb-0.5 whitespace-nowrap">
                {t("remainingAmount")}
              </span>

              <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 leading-none truncate w-full">
                {remainingAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="min-h-0 flex-1 flex flex-col bg-white"
        >
          <div
            className="
              flex-1
              min-h-0
              overflow-y-auto
              overflow-x-hidden
              overscroll-contain
              touch-pan-y
              [-webkit-overflow-scrolling:touch]
            "
          >
            <div className="p-4 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-[13px] font-bold text-slate-700 flex items-center gap-1">
                  {t("paymentAmount")}
                  <span className="text-rose-500">*</span>
                </label>

                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("amount")}
                    className="h-12 sm:h-14 pl-14 px-4 rounded-xl text-lg sm:text-xl font-mono font-bold text-right border-slate-200 bg-slate-50 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-all shadow-inner"
                  />

                  <div className="absolute left-2 top-2 bottom-2 flex items-center justify-center bg-white px-3 rounded-lg border border-slate-200 text-emerald-600 font-bold text-xs sm:text-[13px] shadow-sm">
                    ج.م
                  </div>
                </div>

                {errors.amount && (
                  <p className="text-[11px] text-rose-500 font-bold">
                    {errors.amount.message as string}
                  </p>
                )}

                {Number(watchAmount) > remainingAmount && (
                  <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg mt-1 border border-rose-100 flex items-center gap-1 leading-5">
                    <AlertCircle
                      size={14}
                      className="shrink-0"
                    />

                    <span>{t("warningExceeds")}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 min-w-0">
                  <label className="text-xs sm:text-[13px] font-bold text-slate-700 flex items-center gap-1">
                    {t("paymentMethod")}
                    <span className="text-rose-500">*</span>
                  </label>

                  <Controller
                    control={control}
                    name="payment_method"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-11 sm:h-12 px-4 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs sm:text-[13px] w-full">
                          <SelectValue placeholder="اختر..." />
                        </SelectTrigger>

                        <SelectContent className="rounded-xl">
                          <SelectItem value="CASH">
                            {t("cash")}
                          </SelectItem>

                          <SelectItem value="TRANSFER">
                            {t("transfer")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {errors.payment_method && (
                    <p className="text-[11px] text-rose-500 font-bold">
                      {errors.payment_method.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 min-w-0">
                  <label className="text-xs sm:text-[13px] font-bold text-slate-700 flex items-center gap-1">
                    {t("safe")}
                    <span className="text-rose-500">*</span>
                  </label>

                  <div
                    className={
                      errors.target_safe_id
                        ? "rounded-xl ring-2 ring-rose-500/30 border border-rose-500 overflow-hidden"
                        : "w-full min-w-0"
                    }
                  >
                    <CompanySafeSelect
                      value={watchSafe}
                      onChange={(val) =>
                        setValue(
                          "target_safe_id",
                          val,
                          {
                            shouldValidate: true,
                          }
                        )
                      }
                      className="h-11 sm:h-12 text-xs w-full"
                    />
                  </div>

                  {errors.target_safe_id && (
                    <p className="text-[11px] text-rose-500 font-bold">
                      {errors.target_safe_id.message as string}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="text-xs sm:text-[13px] font-bold text-slate-700 flex items-center gap-1">
                  {t("account")}
                  <span className="text-rose-500">*</span>
                </label>

                <div
                  className={
                    errors.account_id
                      ? "rounded-xl ring-2 ring-rose-500/30 border border-rose-500 overflow-hidden"
                      : "w-full min-w-0"
                  }
                >
                  <AccountSelect
                    value={watchAccount}
                    onChange={(val) =>
                      setValue(
                        "account_id",
                        val,
                        {
                          shouldValidate: true,
                        }
                      )
                    }
                  />
                </div>

                {errors.account_id && (
                  <p className="text-[11px] text-rose-500 font-bold">
                    {errors.account_id.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-[13px] font-bold text-slate-700">
                  {t("notes")}
                </label>

                <Textarea
                  {...register("notes")}
                  className="min-h-14 sm:min-h-16 rounded-xl bg-slate-50 border-slate-200 text-xs sm:text-[13px] resize-none p-2.5 focus-visible:ring-emerald-500/30"
                  placeholder="مثال: دفعة ثانية..."
                />
              </div>
            </div>
          </div>

          <div className="shrink-0 bg-white border-t border-slate-200 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-1/3 h-12 sm:h-14 rounded-xl sm:rounded-2xl text-xs sm:text-[14px] text-slate-600 font-bold bg-white border-slate-200 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60"
              >
                {t("cancel")}
              </Button>

              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !watchAmount ||
                  Number(watchAmount) <= 0 ||
                  Number(watchAmount) > remainingAmount
                }
                className="w-full sm:flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-[14px] shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 ml-2" />
                    {t("confirm")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
