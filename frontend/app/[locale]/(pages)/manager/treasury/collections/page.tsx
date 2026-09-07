"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useGetAllCollectionsQuery, useRemitCollectionMutation } from "@/redux/features/collectionsApiSlice";
import { remitCollectionSchema, RemitCollectionFormValues } from "@/lib/validation/collectionSchema";
import { useDebounce } from "@/hooks/useDebounce";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Banknote, User, CalendarDays, ArrowDownToLine, Search, Filter, Hash, Wallet, ShieldCheck, Sigma } from "lucide-react";

import CompanySafeSelect from "@/components/treasury/CompanySafeSelect";
import AccountSelect from "@/components/treasury/AccountSelect"; 
import DateFilter from "@/components/shared/DateFilter";
import RefreshButton from "@/components/shared/RefreshButton";

export default function CollectionsLedgerPage() {
  const t = useTranslations("collectionsLedger");
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const { data: response, isLoading, isFetching, refetch } = useGetAllCollectionsQuery({
    page, limit: 12, search: debouncedSearch, status: statusFilter === "ALL" ? "" : statusFilter, start_date: startDate, end_date: endDate
  });

  const [remitCollection, { isLoading: isRemitting }] = useRemitCollectionMutation();
  const [selectedCollection, setSelectedCollection] = useState<any>(null);

  const collections = response?.data || [];
  const totalPages = response?.pagination?.totalPages || 1;
  
  const totalRecords = response?.stats?.total_records || 0;
  const pendingAmount = response?.stats?.pending_amount || 0;

  const { register, control, handleSubmit, setValue, reset, formState: { errors } } = useForm({ 
    resolver: zodResolver(remitCollectionSchema) 
  });

  const watchAmount = useWatch({ control, name: "amount" });
  const watchTargetSafeId = useWatch({ control, name: "target_safe_id" }) || ""; 
  const watchAccountId = useWatch({ control, name: "account_id" }) || ""; 

  const getStatusBadge = (is_remitted: boolean) => {
    if (is_remitted) return <Badge className="bg-emerald-50 text-emerald-800  border-emerald-200 p-3 rounded-3xl shadow-sm">{t("badges.remitted")}</Badge>;
    return <Badge className="bg-amber-50 text-amber-900  border-amber-200 p-3 rounded-3xl shadow-sm">{t("badges.pending")}</Badge>;
  };

  const openRemitModal = (coll: any) => {
    setSelectedCollection(coll);
    reset({ amount: Number(coll.amount), target_safe_id: "", account_id: "", notes: "" });
  };

  const handleRemit = async (data: RemitCollectionFormValues) => {
    if (Number(data.amount) > Number(selectedCollection.amount)) {
      return toast.error("لا يمكن توريد مبلغ أكبر من قيمة التحصيل.");
    }
    try {
      await remitCollection({ id: selectedCollection.id, data }).unwrap();
      toast.success("تم خصم المبلغ من عهدة الفني وتوريده للخزنة بنجاح");
      setSelectedCollection(null);
    } catch (err: any) { 
      toast.error(err?.data?.message || "حدث خطأ أثناء التوريد"); 
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-dvw mx-auto space-y-5">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white shadow-md  text-green-800 flex items-center justify-center">
            <Banknote size={24} />
          </div>
        
         <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h1 className="text-lg md:text-xl font-normal tracking-tight text-primary">
                    {t("title")}
                  </h1>
                  {!isLoading && totalRecords && (
                    <Badge className="bg-primary/5 text-primary border-primary/10 rounded-lg font-bold px-2.5 py-0.5 text-[11px] shadow-none">
                      {totalRecords}
                    </Badge>
                  )}
                </div>
                <p className="text-slate-400 mt-1 text-sm font-medium">
                  {t("subtitle")}
                </p>
              </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
       
          <div className="flex-1 lg:flex-none flex items-center gap-2 bg-gray-100 border  px-4 py-2.5 rounded-xl">
            <span className="text-[12px] font-bold text-rose-900"></span>
            <span className="font-mono font-bold text-[15px] text-rose-900">
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
              <SelectTrigger className="h-11 px-4 w-full md:w-[180px] rounded-xl text-[13px] font-bold bg-slate-50 border-slate-200 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL">{t("filters.all")}</SelectItem>
                <SelectItem value="PENDING">{t("filters.pending")}</SelectItem>
                <SelectItem value="REMITTED">{t("filters.remitted")}</SelectItem>
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
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200/60 shadow-sm text-slate-500 font-medium gap-3">
          {t("actions.noData")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((coll: any) => (
            <div key={coll.id} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 relative overflow-hidden transition-all hover:border-slate-300 hover:shadow-md">
              <div className={`absolute top-0 right-0 bottom-0 w-1 `}></div>
              
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1">
                    <Hash size={12}/> {coll.execution_id.slice(0,8)}...
                  </span>
                  <div className="flex items-center gap-1.5 mt-2 text-slate-700 font-bold text-[14px]">
                    <User size={15} className="text-primary" /> {coll.technician_name}
                  </div>
                </div>
                <div>{getStatusBadge(coll.is_remitted)}</div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500">{t("table.amount")}:</span>
                <span className={`font-mono font-bold text-[18px] ${coll.is_remitted ? 'text-slate-800' : 'text-emerald-600'}`}>
                  {Number(coll.amount).toLocaleString()} ج
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100 w-full justify-center">
                <CalendarDays size={13}/> 
                <span>{t("table.date")}: {new Date(coll.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
              </div>

              {!coll.is_remitted && (
                <div className="pt-3 border-t border-slate-100">
                  <Button onClick={() => openRemitModal(coll)} className="w-full h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold shadow-sm transition-all active:scale-[0.98]">
                    <ArrowDownToLine className="w-4 h-4 ml-2 opacity-80" /> {t("actions.remit")}
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

      {/* ================= Remit Modal ================= */}
   <Dialog open={!!selectedCollection} onOpenChange={(open) => !open && setSelectedCollection(null)}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[420px] p-0 rounded-2xl sm:rounded-[2rem] overflow-hidden border-0 bg-slate-50 shadow-2xl flex flex-col max-h-[90vh]">
          
          {/* Header - Fixed */}
          <div className="bg-emerald-900 text-white p-5 sm:p-7 shrink-0 z-10">
            <DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg font-bold">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Wallet className="text-emerald-400 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              {t("modal.title")}
            </DialogTitle>
            <div className="mt-4 sm:mt-5 bg-emerald-800/80 rounded-xl p-3 sm:p-4 border border-emerald-700/50 flex justify-between items-center shadow-inner">
              <span className="text-[12px] sm:text-[13px] text-emerald-100 font-bold">{t("modal.requiredAmount")}</span>
              <span className="font-mono font-bold text-xl sm:text-2xl text-white">
                {selectedCollection ? Number(selectedCollection.amount).toLocaleString() : 0} ج
              </span>
            </div>
          </div>

          {/* Form Content - Scrollable */}
          <div className="flex-1 overflow-y-auto bg-slate-50 -mt-4 sm:-mt-6 rounded-t-2xl sm:rounded-t-[2rem] relative z-20">
            <form id="remit-form" onSubmit={handleSubmit(handleRemit)} className="p-5 sm:p-7 space-y-5">
              
              <div className="space-y-2">
                <label className="text-[12px] sm:text-[13px] font-bold text-slate-700 flex items-center gap-1">
                  {t("modal.actualAmount")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...register("amount")}
                    className="h-11 sm:h-12 pl-12 sm:pl-14 px-3 sm:px-4 rounded-xl text-base sm:text-lg font-mono font-bold text-right border-slate-200 bg-white focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 shadow-sm transition-all"
                  />
                  <div className="absolute left-1.5 top-1.5 bottom-1.5 flex items-center justify-center bg-slate-50 px-2 sm:px-3 rounded-lg border border-slate-100 text-slate-500 font-bold text-[11px] sm:text-[13px]">
                    ج.م
                  </div>
                </div>
                {errors.amount && <p className="text-[10px] sm:text-[11px] text-rose-500 font-bold">{errors.amount.message as string}</p>}
                
                {Number(watchAmount) > (selectedCollection?.amount || 0) && (
                  <p className="text-[10px] sm:text-[11px] text-rose-500 font-bold bg-rose-50 p-2 rounded-lg mt-1 border border-rose-100">
                    {t("modal.warningExcess")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[12px] sm:text-[13px] font-bold text-slate-700 flex items-center gap-1">
                  حساب استلام العهدة <span className="text-rose-500">*</span>
                </label>
                <div className={errors.account_id ? "rounded-xl ring-2 ring-rose-500/30 border border-rose-500 overflow-hidden" : ""}>
                  <AccountSelect 
                    value={watchAccountId}
                    onChange={(val: string) => setValue("account_id", val, { shouldValidate: true })} 
                  />
                </div>
                {errors.account_id && <p className="text-[10px] sm:text-[11px] text-rose-500 font-bold">{errors.account_id.message as string}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[12px] sm:text-[13px] font-bold text-slate-700 flex items-center gap-1">
                  {t("modal.targetSafe")} <span className="text-rose-500">*</span>
                </label>
                <div className={errors.target_safe_id ? "rounded-xl ring-2 ring-rose-500/30 border border-rose-500 overflow-hidden" : ""}>
                  <CompanySafeSelect 
                    value={watchTargetSafeId}
                    onChange={(val: any) => setValue("target_safe_id", val, { shouldValidate: true })} 
                  />
                </div>
                {errors.target_safe_id && <p className="text-[10px] sm:text-[11px] text-rose-500 font-bold">{errors.target_safe_id.message as string}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[12px] sm:text-[13px] font-bold text-slate-700">{t("modal.notes")}</label>
                <Textarea 
                  {...register("notes")} 
                  className="h-20 sm:h-24 rounded-xl bg-white border-slate-200 text-[12px] sm:text-[13px] resize-none p-3 sm:p-4 focus-visible:ring-emerald-500/30 transition-all" 
                  placeholder={t("modal.notesPlaceholder")} 
                />
              </div>

            </form>
          </div>

          {/* Footer Actions - Fixed */}
          <div className="bg-white border-t border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row gap-2.5 sm:gap-3 shrink-0 z-10">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setSelectedCollection(null)} 
              className="w-full sm:w-1/3 h-11 sm:h-12 rounded-xl text-[13px] sm:text-[14px] text-slate-600 font-bold bg-white border-slate-200 hover:bg-slate-50 transition-all order-2 sm:order-1"
            >
              {t("modal.cancel")}
            </Button>
            <Button 
              type="submit" 
              form="remit-form"
              disabled={isRemitting || !watchAmount || Number(watchAmount) <= 0} 
              className="w-full sm:flex-1 h-11 sm:h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[13px] sm:text-[14px] shadow-md transition-all active:scale-[0.98] order-1 sm:order-2"
            >
              {isRemitting ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <><ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5" /> {t("modal.confirm")}</>}
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}