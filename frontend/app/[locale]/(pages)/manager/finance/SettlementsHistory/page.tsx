"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, Printer, CheckCircle2, History, FileText } from "lucide-react";

import { useGetSettlementsHistoryQuery } from "@/redux/features/technicianEarningsApiSlice";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DateFilter from "@/components/shared/DateFilter";
import { generateSettlementPDF } from "@/lib/pdf/SettlementPDF";
import RefreshButton from "@/components/shared/RefreshButton";

export default function SettlementsHistoryPage() {
  const searchParams = useSearchParams();
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: response, isFetching, refetch } = useGetSettlementsHistoryQuery({
    search: debouncedSearch,
    start_date: startDate,
    end_date: endDate,
    page,
    limit,
  });

  const settlements = response?.data || [];
  const meta = response?.meta || { totalPages: 1 };

  return (
    <div className="flex flex-col p-4 max-w-dvw md:p-6 min-h-screen bg-slate-50/50 w-full" dir="rtl">
      <div className="flex flex-row flex-wrap md:flex-row bg-primary rounded-2xl justify-between items-start md:items-center gap-5 p-5 md:p-6 shadow-md mb-6 w-full">
        <div className="flex bg-primary items-center gap-4">
          <div className="w-12 h-12 shrink-0 bg-white rounded-xl flex items-center justify-center text-primary">
            <History size={26} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col text-right">
            <h1 className="text-xl font-normal tracking-tight text-white">أرشيف التسويات المدفوعة</h1>
            <p className="text-slate-300 mt-1 text-sm font-medium">سجلات وإيصالات القبض الخاصة بالفنيين الميدانيين.</p>
          </div>
        </div>
        <div className="bg-white rounded-full">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon" />
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-white border border-slate-200/60 shadow-sm p-5 md:p-6 rounded-2xl w-full mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-4 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ابحث برقم الكشف (PAY-...) أو اسم الفني"
              className="pr-11 pl-4 w-full rounded-xl border-slate-200 shadow-sm h-11 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-primary/20 text-right font-bold text-slate-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="pt-4 border-t border-slate-100">
          <DateFilter />
        </div>
      </div>

      {isFetching ? (
        <div className="text-center py-20 text-slate-500 font-bold flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
          جاري تحميل الأرشيف...
        </div>
      ) : settlements.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-20 text-center text-slate-400 font-bold shadow-sm flex flex-col items-center justify-center">
          <FileText className="w-12 h-12 mb-3 opacity-20" />
          لا توجد كشوف تسوية مطابقة للبحث.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full transition-all animate-in fade-in">
          {settlements.map((item: any) => (
            <div key={item.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg text-sm">
                  {item.settlement_ref}
                </span>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-slate-700 text-sm text-left">
                    {format(new Date(item.created_at), 'yyyy/MM/dd', { locale: ar })}
                  </span>
                  <span className="text-[11px] text-slate-500 text-left">بواسطة: {item.created_by_name}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">اسم الفني:</span>
                  <span className="font-bold text-slate-800">{item.technician_name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">المبلغ المدفوع:</span>
                  <span className="font-mono font-bold text-base text-rose-600 bg-rose-50 px-3 py-1 rounded-md border border-rose-100">
                    {Number(item.total_amount).toLocaleString()} ج.م
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">الخزنة / البند:</span>
                  <div className="flex flex-col text-left text-[12px] font-medium text-slate-600">
                    <span className="font-bold text-slate-800">{item.safe_name}</span>
                    <span className="text-slate-500">{item.account_name}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-auto">
                <Button
                  size="sm"
                  onClick={() => generateSettlementPDF(item)}
                  className="h-10 w-full rounded-xl bg-primary text-white font-bold text-sm shadow-sm flex justify-center items-center gap-2 hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" /> طباعة السند
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-xl h-10 px-5 font-bold border-slate-200">
            السابق
          </Button>
          <div className="bg-white border border-slate-200 h-10 px-5 flex items-center justify-center rounded-xl text-sm font-bold text-slate-600 shadow-sm">
            صفحة {page} من {meta.totalPages}
          </div>
          <Button variant="outline" disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl h-10 px-5 font-bold border-slate-200">
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}