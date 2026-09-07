"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useGetTreasuryTransactionsQuery } from "@/redux/features/treasurySafesApiSlice";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ArrowDownRight, ArrowUpRight, CalendarDays, Wallet, Hash, User, AlignLeft, ChevronRight, ChevronLeft, Filter } from "lucide-react";
import DateFilter from "@/components/shared/DateFilter";
import RefreshButton from "@/components/shared/RefreshButton";

export default function TreasuryTransactionsPage() {
  const t = useTranslations("treasuryTransactions");
  const searchParams = useSearchParams();

  // ===== States =====
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // جلب التواريخ من الـ URL التي يضيفها مكون DateFilter
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  // ===== Fetch Data =====
  const { data: response, isLoading, isFetching ,refetch } = useGetTreasuryTransactionsQuery({
    page,
    limit: 15,
    search: debouncedSearch,
    type: typeFilter === "ALL" ? "" : typeFilter,
    start_date: startDate,
    end_date: endDate,
  });

  const transactions = response?.data || [];
  const totalPages = response?.pagination?.totalPages || 1;

  // ===== Helpers =====
  const getTransactionBadge = (type: string) => {
    if (type === "IN") {
      return (
        <Badge className="bg-emerald-50 text-emerald-800 border w-24 rounded-3xl shadow-sm border-emerald-200 px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 ">
          <ArrowDownRight size={14} /> {t("filters.in")}
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-50 text-rose-800 border border-rose-200 w-24 rounded-3xl shadow-sm  px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 ">
        <ArrowUpRight size={14} /> {t("filters.out")}
      </Badge>
    );
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-dvw mx-auto space-y-5">
      
      {/* ================= Header ================= */}
      <div className="flex flex-row justify-between flex-wrap items-center gap-4 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200/60">
       <div className="flex  gap-3">
        <div className="w-12 h-12 rounded-xl bg-white shadow-md border-gray-200  text-primary flex items-center justify-center shrink-0">
          <Wallet size={24} />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-normal text-slate-800">{t("title")}</h1>
          <p className="text-[12px] md:text-[13px] text-slate-500 font-medium">{t("subtitle")}</p>
        </div>

       </div>
 
        <div className="">
            
            <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon" />
        </div>
      </div>

      {/* ================= Filters Section ================= */}
      <div className="space-y-4">
        
        <div className="w-full">
          <DateFilter />
        </div>

        {/* شريط البحث وفلتر النوع */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search */}
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="h-11 pr-10 pl-4 rounded-xl text-[13px] bg-slate-50 border-slate-200 focus-visible:ring-primary/20 shadow-none w-full"
            />
          </div>

          {/* Type Filter (تم فصله ووضعه بشكل أنيق) */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5 shrink-0">
              <Filter size={14} className="text-slate-400" />
              تصفية حسب النوع:
            </span>
            <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
              <SelectTrigger className="h-11 w-full md:w-[180px] px-4 rounded-xl text-[13px] font-bold bg-slate-50 border-slate-200 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL">{t("filters.allTypes")}</SelectItem>
                <SelectItem value="IN">{t("filters.in")}</SelectItem>
                <SelectItem value="OUT">{t("filters.out")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      {/* ================= Loading State ================= */}
      {isLoading || isFetching ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200/60 shadow-sm gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-[12px] text-slate-500 font-medium">جاري جلب السجلات المالية...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200/60 shadow-sm text-slate-500 font-medium gap-3">
          <AlignLeft className="w-12 h-12 text-slate-300" />
          لا توجد حركات مطابقة لبحثك
        </div>
      ) : (
        <>
          {/* ================= Desktop Table ================= */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-[12px]">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3 whitespace-nowrap">{t("table.id")}</th>
                    <th className="px-5 py-3 whitespace-nowrap">{t("table.date")}</th>
                    <th className="px-5 py-3 whitespace-nowrap">{t("table.safe")}</th>
                    <th className="px-5 py-3 whitespace-nowrap">{t("table.account")}</th>
                    <th className="px-5 py-3 whitespace-nowrap text-center">{t("table.type")}</th>
                    <th className="px-5 py-3 whitespace-nowrap text-left">{t("table.amount")}</th>
                    <th className="px-5 py-3 whitespace-nowrap">{t("table.reference")}</th>
                    <th className="px-5 py-3 whitespace-nowrap w-48">{t("table.notes")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tr: any) => (
                    <tr key={tr.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-slate-400 whitespace-nowrap">#{tr.id}</td>
                      <td className="px-5 py-3 text-slate-600 font-medium whitespace-nowrap">
                        {new Date(tr.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-700 whitespace-nowrap">{tr.safe_name || "-"}</td>
                      <td className="px-5 py-3 font-medium text-sky-600 whitespace-nowrap bg-sky-50/30">
                        {tr.account_name || "بدون حساب"}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap flex justify-center">
                        {getTransactionBadge(tr.transaction_type)}
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-[14px] text-left whitespace-nowrap">
                        <span className={tr.transaction_type === "IN" ? "text-emerald-600" : "text-rose-600"}>
                          {Number(tr.amount).toLocaleString()} ج
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {tr.reference_type ? (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono text-[10px]">
                            {tr.reference_type} : {tr.reference_id}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-wrap font-medium max-w-[250px] truncate" title={tr.notes}>
                        {tr.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= Mobile Cards ================= */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {transactions.map((tr: any) => (
              <div key={tr.id} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-3 relative overflow-hidden">
                
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 font-mono">
                      <Hash size={12}/> {tr.id}
                    </span>
                    <h3 className="font-bold text-[13px] text-slate-800">{tr.safe_name || "خزنة غير محددة"}</h3>
                  </div>
                  <div>{getTransactionBadge(tr.transaction_type)}</div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400">{t("table.amount")}</span>
                    <p className={`font-mono font-bold text-[15px] ${tr.transaction_type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {Number(tr.amount).toLocaleString()} ج
                    </p>
                  </div>
                  <div className="text-left space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400">{t("table.account")}</span>
                    <p className="font-bold text-[11px] text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                      {tr.account_name || "بدون حساب"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <CalendarDays size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{new Date(tr.created_at).toLocaleDateString("en-GB")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <User size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{tr.created_by_name}</span>
                  </div>
                </div>

                {tr.notes && (
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-start gap-1.5">
                    <AlignLeft size={12} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{tr.notes}</p>
                  </div>
                )}
                
                {tr.reference_type && (
                  <div className="text-[10px] text-slate-400 font-mono text-left pt-1">
                    Ref: {tr.reference_type}-{tr.reference_id}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ================= Pagination ================= */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm mt-4">
              <span className="text-[12px] font-bold text-slate-500">
                صفحة {page} من {totalPages}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="h-9 px-3 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4 ml-1" /> السابق
                </Button>
                
                <div className="hidden sm:flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                    .map((p, index, array) => {
                      if (index > 0 && p - array[index - 1] > 1) {
                        return <span key={`dots-${p}`} className="px-2 text-slate-400">...</span>;
                      }
                      return (
                        <Button 
                          key={p}
                          variant={p === page ? "default" : "outline"}
                          onClick={() => handlePageChange(p)}
                          className={`w-9 h-9 rounded-xl font-bold text-[12px] ${p === page ? 'bg-primary text-white' : 'text-slate-600'}`}
                        >
                          {p}
                        </Button>
                      );
                    })}
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="h-9 px-3 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50"
                >
                  التالي <ChevronLeft className="w-4 h-4 mr-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}