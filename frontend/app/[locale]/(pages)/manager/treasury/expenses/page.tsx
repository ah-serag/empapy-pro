"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useGetAllExpensesQuery, useApproveExpenseMutation, useRejectExpenseMutation } from "@/redux/features/expensesApiSlice";
import { approveExpenseSchema, ApproveExpenseFormValues } from "@/lib/validation/expenseSchema";
import { useDebounce } from "@/hooks/useDebounce";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Receipt, User, CalendarDays, Search, Filter, Hash, ShieldCheck, Sigma, Ban, Info, AlertTriangle } from "lucide-react";

import AccountSelect from "@/components/treasury/AccountSelect"; 
import DateFilter from "@/components/shared/DateFilter";
import RefreshButton from "@/components/shared/RefreshButton";

export default function ExpensesLedgerPage() {
  const t = useTranslations("expensesLedger");
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const { data: response, isLoading, isFetching, refetch } = useGetAllExpensesQuery({
    page, limit: 12, search: debouncedSearch, status: statusFilter === "ALL" ? "" : statusFilter, start_date: startDate, end_date: endDate
  });

  const [approveExpense, { isLoading: isApproving }] = useApproveExpenseMutation();
  const [rejectExpense, { isLoading: isRejecting }] = useRejectExpenseMutation();
  
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  
  const [expenseToReject, setExpenseToReject] = useState<any>(null);
  const [confirmRejectName, setConfirmRejectName] = useState("");

  const expenses = response?.data || [];
  const totalPages = response?.pagination?.totalPages || 1;
  const totalRecords = response?.stats?.total_records || 0;
  const pendingAmount = response?.stats?.pending_amount || 0;

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({ 
    resolver: zodResolver(approveExpenseSchema) 
  });

  const watchAmount = useWatch({ control, name: "amount" });
  const watchAccountId = useWatch({ control, name: "account_id" }) || ""; // 🔴 مراقبة قيمة حساب المصروف

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED": return <Badge className="bg-emerald-50 rounded-3xl p-2 text-emerald-800 border-emerald-200">{t("badges.approved")}</Badge>;
      case "REJECTED": return <Badge className="bg-rose-50 rounded-3xl p-2 text-rose-800 border-rose-200">{t("badges.rejected")}</Badge>;
      default: return <Badge className="bg-amber-50 rounded-3xl p-2 text-amber-800 border-amber-200">{t("badges.pending")}</Badge>;
    }
  };

  const openApproveModal = (exp: any) => {
    setSelectedExpense(exp);
    // 🔴 تصفير الحقول وإضافة account_id
    reset({ amount: Number(exp.amount), account_id: "", notes: "" });
  };

  const handleApprove = async (data: ApproveExpenseFormValues) => {
    if (Number(data.amount) > Number(selectedExpense.amount)) {
      return toast.error("لا يمكن اعتماد مبلغ أكبر من قيمة المصروف المسجل.");
    }
    try {
      await approveExpense({ id: selectedExpense.id, data }).unwrap();
      toast.success("تم اعتماد المصروف وتوجيهه محاسبياً بنجاح وتسوية عهدة الفني.");
      setSelectedExpense(null);
    } catch (err: any) { 
      toast.error(err?.data?.message || "حدث خطأ أثناء الاعتماد"); 
    }
  };

  const handleConfirmReject = async () => {
    if (confirmRejectName !== expenseToReject.technician_name) {
      return toast.error("اسم الفني غير متطابق. يرجى كتابة الاسم بشكل صحيح للتأكيد.");
    }
    try {
      await rejectExpense(expenseToReject.id).unwrap();
      toast.success("تم رفض المصروف بنجاح ولن يتم تسويته.");
      setExpenseToReject(null);
      setConfirmRejectName("");
    } catch (err: any) { 
      toast.error(err?.data?.message || "حدث خطأ أثناء الرفض"); 
    }
  };

  const closeRejectModal = () => {
    setExpenseToReject(null);
    setConfirmRejectName("");
  };

  return (
    <div className="p-4 md:p-6 max-w-dvw mx-auto space-y-5">
      {/* ================= Header & Stats ================= */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white text-red-950 shadow-md flex items-center justify-center">
            <Receipt size={24} />
          </div>
          <div>
            <h1 className="text-xl font-normal text-red-950">{t("title")}</h1>
            <p className="text-[13px] text-slate-500 font-medium">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex-1 lg:flex-none flex items-center gap-2 bg-red-50 border border-amber-100 px-4 py-2.5 rounded-xl">
            <Sigma size={16} className="text-red-900" />
            <span className="font-mono font-bold text-[15px] text-red-900">
              {pendingAmount.toLocaleString()} ج
            </span>
          </div>

          <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon" />
        </div>
      </div>


      {/* ================= Filters ================= */}
      <div className="space-y-4">
        <div className="w-full">
          <DateFilter />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder={t("searchPlaceholder")}
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} 
              className="h-11 pr-10 pl-4 rounded-xl text-[13px] bg-slate-50 border-slate-200 shadow-none w-full" 
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5 shrink-0">
              <Filter size={14} className="text-slate-400" /> {t("filters.status")}
            </span>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="h-11 w-full px-4 md:w-[180px] rounded-xl text-[13px] font-bold bg-slate-50 border-slate-200 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl px-4">
                <SelectItem value="ALL">{t("filters.all")}</SelectItem>
                <SelectItem value="PENDING_APPROVAL">{t("filters.pending")}</SelectItem>
                <SelectItem value="APPROVED">{t("filters.approved")}</SelectItem>
                <SelectItem value="REJECTED">{t("filters.rejected")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ================= Content ================= */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200/60 shadow-sm gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-[12px] text-slate-500 font-medium">{t("actions.loading")}</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200/60 shadow-sm text-slate-500 font-medium gap-3">
          {t("actions.noData")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {expenses.map((exp: any) => (
            <div key={exp.id} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col relative overflow-hidden transition-all hover:border-slate-300 hover:shadow-md h-full">

              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1.5 w-[65%]">
                  <span className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1">
                    <Hash size={12}/> {exp.execution_id.slice(0,8)}...
                  </span>
                  <h3 className="font-bold text-[13px] text-slate-800 leading-snug line-clamp-2" title={exp.reason}>
                    {exp.reason}
                  </h3>
                </div>
                <div>{getStatusBadge(exp.status)}</div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-100 mb-4">
                <span className="text-[11px] font-bold text-slate-500">{t("table.amount")}:</span>
                <span className={`font-mono font-bold rounded-3xl p-2 text-[18px] ${exp.status === 'APPROVED' ? 'text-emerald-600' : exp.status === 'REJECTED' ? 'text-rose-500' : 'text-slate-800'}`}>
                  {Number(exp.amount).toLocaleString()} ج
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100 w-full">
                  <User size={12} className="text-primary"/> <span className="truncate">{exp.technician_name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100 w-full justify-center">
                  <CalendarDays size={12}/> <span>{new Date(exp.created_at).toLocaleDateString("en-GB")}</span>
                </div>
              </div>

              {exp.status === 'PENDING_APPROVAL' && (
                <div className="pt-4 mt-auto border-t border-slate-100 flex gap-2">
                  <Button onClick={() => setExpenseToReject(exp)} variant="outline" className="h-11  rounded-full bg-rose-50 text-red-800  hover:bg-rose-50  transition-colors shrink-0">
                     <Ban size={18} />
                  </Button>
                  <Button onClick={() => openApproveModal(exp)} className="flex-1 h-11 rounded-xl bg-primary text-white hover:bg-primary/90 font-bold shadow-sm transition-all active:scale-[0.98]">
                    <ShieldCheck className="w-4 h-4 ml-2 opacity-80" /> {t("actions.approve")}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================= Pagination ================= */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Button 
              key={p} 
              variant={p === page ? "default" : "outline"} 
              onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className={`w-9 h-9 rounded-xl font-bold ${p === page ? 'bg-primary text-white shadow-md' : 'text-slate-600 bg-white'}`}
            >
              {p}
            </Button>
          ))}
        </div>
      )}

      {/* ================= Approve Modal ================= */}
     <Dialog open={!!selectedExpense} onOpenChange={(open) => !open && setSelectedExpense(null)}>
  {/* 
    flex flex-col & max-h-[90vh] & overflow-hidden:
    تضمن أن المودال لن يتجاوز 90% من الشاشة وسيسمح للمحتوى الداخلي بالتمرير بشكل سليم
  */}
  <DialogContent aria-describedby={undefined} className="sm:max-w-[480px] p-0 rounded-2xl sm:rounded-[2rem] overflow-hidden border-0 bg-slate-50 shadow-2xl flex flex-col max-h-[90vh]" dir="rtl">
    
    {/* ================= Header (ثابت) ================= */}
    {/* shrink-0 يمنع هذا الجزء من الانكماش ويجعله ثابتاً، pb-10 يعطي مساحة للتداخل مع النموذج تحته */}
    <div className="bg-indigo-900 text-white p-5 sm:p-7 pb-10 sm:pb-12 relative shrink-0 z-10">
      <DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg font-bold">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
          <Receipt className="text-indigo-400 w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        {t("modal.title")}
      </DialogTitle>
      <div className="mt-4 sm:mt-5 bg-indigo-800/80 rounded-xl p-3 sm:p-4 border border-indigo-700/50 flex justify-between items-center shadow-inner">
        <span className="text-[12px] sm:text-[13px] text-indigo-100 font-bold">{t("modal.requiredAmount")}</span>
        <span className="font-mono font-bold text-xl sm:text-2xl text-white">
          {selectedExpense ? Number(selectedExpense.amount).toLocaleString() : 0} ج
        </span>
      </div>
    </div>

    {/* ================= Form Wrapper ================= */}
    {/* flex-1 & min-h-0 تجعل هذا الجزء يأخذ المساحة المتبقية فقط وتفعل التمرير للمحتوى الداخلي */}
    <form id="approve-expense-form" onSubmit={handleSubmit(handleApprove)} className="flex-1 flex flex-col min-h-0 bg-slate-50 -mt-6 sm:-mt-8 rounded-t-2xl sm:rounded-t-[2rem] relative z-20 overflow-hidden shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)]">
      
      {/* ================= Content (قابل للتمرير) ================= */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 sm:space-y-5">
        
        <div className="bg-indigo-50/80 border border-indigo-100 p-3.5 sm:p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <Info className="text-indigo-500 w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
          <p className="text-[11px] sm:text-[12px] text-indigo-800 font-medium leading-relaxed">
            {t("modal.infoText")}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-[12px] sm:text-[13px] font-bold text-slate-700 flex items-center gap-1">
            {t("modal.actualAmount")} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Input 
              type="number" 
              step="0.01" 
              {...register("amount")}
              className="h-11 sm:h-12 pl-12 sm:pl-14 px-3 sm:px-4 rounded-xl text-base sm:text-lg font-mono font-bold text-right border-slate-200 bg-white focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 shadow-sm transition-all"
            />
            <div className="absolute left-1.5 top-1.5 bottom-1.5 flex items-center justify-center bg-slate-50 px-2 sm:px-3 rounded-lg border border-slate-100 text-slate-500 font-bold text-[11px] sm:text-[13px]">
              ج.م
            </div>
          </div>
          {errors.amount && <p className="text-[10px] sm:text-[11px] text-rose-500 font-bold">{errors.amount.message as string}</p>}

          {Number(watchAmount) > (selectedExpense?.amount || 0) && (
            <p className="text-[10px] sm:text-[11px] text-rose-500 font-bold bg-rose-50 p-2.5 rounded-lg mt-1.5 border border-rose-100 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 shrink-0" />
              {t("modal.warningExcess")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[12px] sm:text-[13px] font-bold text-slate-700 flex items-center gap-1">
            تصنيف المصروف (شجرة الحسابات) <span className="text-rose-500">*</span>
          </label>
          <div className={errors.account_id ? "rounded-xl ring-2 ring-rose-500/30 border border-rose-500 overflow-hidden" : ""}>
            <AccountSelect 
              value={watchAccountId}
              onChange={(val: string) => setValue("account_id", val, { shouldValidate: true })} 
              placeholder="اختر حساب المصروف..."
            />
          </div>
          {errors.account_id && <p className="text-[10px] sm:text-[11px] text-rose-500 font-bold">{errors.account_id.message as string}</p>}
        </div>

        <div className="space-y-2 pb-2">
          <label className="text-[12px] sm:text-[13px] font-bold text-slate-700">{t("modal.notes")}</label>
          <Textarea 
            {...register("notes")} 
            className="h-20 sm:h-24 rounded-xl bg-white border-slate-200 text-[12px] sm:text-[13px] resize-none p-3 sm:p-4 focus-visible:ring-indigo-500/30 transition-all shadow-sm" 
            placeholder={t("modal.notesPlaceholder")} 
          />
        </div>
      </div>

      {/* ================= Footer (ثابت بالأسفل) ================= */}
      {/* shrink-0 يمنعه من الاختفاء ويجعله ثابتاً خارج منطقة السكرول */}
      <div className="shrink-0 bg-white border-t border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-3 z-30">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setSelectedExpense(null)} 
          className="w-full sm:w-1/3 h-11 sm:h-12 rounded-xl text-[13px] sm:text-[14px] text-slate-600 font-bold bg-white border-slate-200 hover:bg-slate-50 transition-all order-2 sm:order-1"
        >
          {t("modal.cancel")}
        </Button>
        <Button 
          type="submit" 
          disabled={isApproving || !watchAmount || Number(watchAmount) <= 0} 
          className="w-full sm:flex-1 h-11 sm:h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[13px] sm:text-[14px] shadow-md transition-all active:scale-[0.98] order-1 sm:order-2"
        >
          {isApproving ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <><ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5" /> {t("modal.confirm")}</>}
        </Button>
      </div>

    </form>
  </DialogContent>
</Dialog>
      {/* ================= Reject Confirmation Modal ================= */}
      <Dialog open={!!expenseToReject} onOpenChange={(open) => !open && closeRejectModal()}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[420px] p-0 rounded-[2rem] overflow-hidden border-0 bg-white shadow-2xl">
          <div className="bg-rose-600 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-rose-700/20 pattern-diagonal-lines sm opacity-20"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-4 ring-rose-500/30">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold text-white mb-1">تأكيد رفض المصروف</DialogTitle>
              <p className="text-rose-100 text-[13px] font-medium leading-relaxed max-w-[85%]">
                هذا الإجراء نهائي. لن يتم تسوية هذا المبلغ للفني وسيعتبر المصروف ملغياً.
              </p>
            </div>
          </div>

          <div className="p-7 space-y-6">
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-rose-200/60">
                <span className="text-[12px] text-rose-600 font-bold">المبلغ المرفوض:</span>
                <span className="font-mono text-lg font-bold text-rose-700">{expenseToReject ? Number(expenseToReject.amount).toLocaleString() : 0} ج.م</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-rose-600 font-bold">اسم الفني:</span>
                <span className="text-[13px] font-bold text-slate-800">{expenseToReject?.technician_name}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[13px] font-bold text-slate-700 block text-center">
                للتأكيد، يرجى كتابة اسم الفني <br/>
                <span className="text-slate-900 bg-slate-100 px-2 py-1 rounded-md font-mono mt-2 inline-block shadow-sm select-all">
                  {expenseToReject?.technician_name}
                </span>
              </label>
              <Input 
                type="text" 
                placeholder="اكتب اسم الفني هنا..." 
                value={confirmRejectName}
                onChange={(e) => setConfirmRejectName(e.target.value)}
                className="h-12 rounded-xl text-center font-bold border-slate-200 bg-slate-50 focus-visible:ring-rose-500/30 focus-visible:border-rose-500 transition-all"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <Button type="button" variant="outline" onClick={closeRejectModal} className="flex-1 h-12 rounded-2xl text-[14px] text-slate-600 font-bold bg-white border-slate-200 hover:bg-slate-50">
                تراجع
              </Button>
              <Button 
                type="button" 
                onClick={handleConfirmReject}
                disabled={isRejecting || confirmRejectName !== expenseToReject?.technician_name} 
                className="flex-[1.5] h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[14px] shadow-lg shadow-rose-600/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-rose-600"
              >
                {isRejecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Ban className="w-5 h-5 ml-2" /> تأكيد الرفض</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}