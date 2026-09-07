"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useGetInventoryTransactionsQuery } from "@/redux/features/wareHouse";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, PackageSearch, ArrowDownRight, ArrowUpRight, Calendar, User, FileText } from "lucide-react";

import DateFilter from "@/components/shared/DateFilter";
import RefreshButton from "@/components/shared/RefreshButton";

export default function InventoryTransactionsPage() {
  const t = useTranslations("inventoryTransactions");
  const locale = useLocale();

  const params = useSearchParams();
  const startDate = params.get("startDate") || "";
  const endDate = params.get("endDate") || "";
  
  const [filters, setFilters] = useState({
    search: "",
    transaction_type: "",
    source: "",
    limit: 20,
    page: 1, 
  });

  const queryParams = {
    ...filters,
    start_date: startDate,
    end_date: endDate,
  };

  const { data: transactionsData, isLoading, refetch, isFetching, isError } = useGetInventoryTransactionsQuery(queryParams);

  // --- Formatters & Badges ---
  const getTransactionBadge = (type: string) => {
    if (type === 'IN') {
      return (
        <Badge className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 rounded-lg px-2.5 py-1 text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm font-bold">
          <ArrowDownRight size={14} strokeWidth={2.5} /> {t("filters.in")}
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 rounded-lg px-2.5 py-1 text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm font-bold">
        <ArrowUpRight size={14} strokeWidth={2.5} /> {t("filters.out")}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(locale, { 
      year: "numeric", 
      month: "short", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="flex flex-col p-2 max-w-dvw md:p-4 min-h-screen bg-slate-50/50 w-full font-sans" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row rounded-2xl flex-wrap justify-between items-start md:items-center gap-5 bg-white p-4 md:p-5 border border-slate-200/60 shadow-sm mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-center text-primary">
            <PackageSearch size={26} strokeWidth={1.5} />
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-normal tracking-tight text-primary">
                {t("title")}
              </h1>
              {!isLoading && transactionsData?.pagination && (
                <Badge className="bg-primary/10 hover:bg-primary/20 text-primary border-none rounded-lg font-bold px-2.5 py-0.5 text-[12px]">
                  {transactionsData.pagination.total_records}
                </Badge>
              )}
            </div>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon" />
        </div>
      </div>

      <div className="space-y-4 w-full">
        
        {/* ================= FILTERS & DATE ================= */}
        <div className="flex flex-col gap-4 bg-white border border-slate-200/60 shadow-sm p-5 md:p-6 rounded-2xl w-full">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t("filters.searchPlaceholder")}
                className="pl-11 pr-4 w-full rounded-xl border-slate-200 shadow-sm h-12 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary font-medium"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              />
            </div>

            {/* Select Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              
              <Select onValueChange={(val) => setFilters({ ...filters, transaction_type: val === "all" ? "" : val, page: 1 })}>
                <SelectTrigger className="w-full sm:w-[200px] px-4 rounded-xl border-slate-200 shadow-sm h-12 bg-slate-50/50 focus:ring-2 focus:ring-primary/20 font-medium">
                  <SelectValue placeholder={t("filters.typeLabel")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  <SelectItem value="all" className="rounded-lg">{t("filters.allTypes")}</SelectItem>
                  <SelectItem value="IN" className="rounded-lg text-emerald-600 font-medium">{t("filters.in")}</SelectItem>
                  <SelectItem value="OUT" className="rounded-lg text-rose-600 font-medium">{t("filters.out")}</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(val) => setFilters({ ...filters, source: val === "all" ? "" : val, page: 1 })}>
                <SelectTrigger className="w-full sm:w-[200px] px-4 rounded-xl border-slate-200 shadow-sm h-12 bg-slate-50/50 focus:ring-2 focus:ring-primary/20 font-medium">
                  <SelectValue placeholder={t("filters.sourceLabel")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  <SelectItem value="all" className="rounded-lg">{t("filters.allSources")}</SelectItem>
                  <SelectItem value="JOB_EXECUTION" className="rounded-lg">{t("filters.source_JOB_EXECUTION")}</SelectItem>
                  <SelectItem value="PURCHASE" className="rounded-lg">{t("filters.source_PURCHASE")}</SelectItem>
                  <SelectItem value="RETURN" className="rounded-lg">{t("filters.source_RETURN")}</SelectItem>
                  <SelectItem value="ADJUSTMENT" className="rounded-lg">{t("filters.source_ADJUSTMENT")}</SelectItem>
                </SelectContent>
              </Select>
              
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <DateFilter />
          </div>
        </div>

        {/* ================= DATA VIEW ================= */}
        <div className="w-full">
          {isLoading ? (
            <div className="bg-white border border-slate-200/60 rounded-2xl p-16 text-center text-slate-500 font-bold shadow-sm flex flex-col items-center justify-center gap-3">
               <PackageSearch className="w-10 h-10 text-slate-300 animate-pulse" />
               جاري التحميل...
            </div>
          ) : isError ? (
            <div className="bg-white border border-rose-100 rounded-2xl p-16 text-center text-rose-500 font-bold shadow-sm flex flex-col items-center justify-center gap-3 ">
              حدث خطأ في تحميل البيانات
            </div>
          ) : transactionsData?.data?.length === 0 ? (
            <div className="bg-white border border-slate-200/60 rounded-2xl p-16 text-center text-slate-500 font-bold shadow-sm flex flex-col items-center justify-center gap-3">
              <PackageSearch className="w-12 h-12 text-slate-200" />
              {t("table.noData")}
            </div>
          ) : (
            <>
              {/* === DESKTOP TABLE VIEW (Hidden on Mobile/Tablet) === */}
              <div className="hidden lg:block bg-white border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden w-full animate-in fade-in duration-300">
                <div className="overflow-x-auto w-full">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                      <TableRow>
                        <TableHead className="font-bold text-center text-slate-600 w-[80px] py-4">{t("table.id")}</TableHead>
                        <TableHead className="font-bold text-center text-slate-600 py-4">{t("table.material")}</TableHead>
                        <TableHead className="font-bold text-center text-slate-600 py-4">{t("table.type")}</TableHead>
                        <TableHead className="font-bold text-center text-slate-600 py-4">{t("table.source")}</TableHead>
                        <TableHead className="font-bold text-center text-slate-600 py-4">{t("table.quantity")}</TableHead>
                        <TableHead className="font-bold text-center text-slate-600 py-4">{t("table.balanceAfter")}</TableHead>
                        <TableHead className="font-bold text-center text-slate-600 py-4">{t("table.cost")}</TableHead>
                        <TableHead className="font-bold text-center text-slate-600 py-4">{t("table.user")}</TableHead>
                        <TableHead className="font-bold text-center text-slate-600 py-4">{t("table.date")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsData?.data?.map((tx: any) => (
                        <TableRow key={tx.id} className="hover:bg-slate-50/80 transition-colors text-center border-b border-slate-50">
                          
                          <TableCell className="font-mono font-bold text-xs text-slate-500">
                            #{tx.id}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex flex-col gap-1 items-center">
                              <span className="text-[13px] font-bold text-slate-800">{tx.material_name}</span>
                              <span className="text-[11px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{tx.material_code}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-center">
                              {getTransactionBadge(tx.transaction_type)}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex text-wrap flex-col items-center gap-1 max-w-[150px] mx-auto">
                              <span className="text-[12px] font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                {t(`filters.source_${tx.source}`)}
                              </span>
                              {tx.notes && (
                                <span className="text-[10px] text-wrap text-slate-500 truncate w-full text-center mt-0.5" title={tx.notes}>
                                  {tx.notes}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className={`text-[15px] font-mono font-bold ${tx.transaction_type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {tx.transaction_type === 'IN' ? '+' : '-'}{tx.quantity}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 text-[13px] font-mono font-bold">
                              {tx.balance_after}
                            </span>
                          </TableCell>

                          <TableCell className="text-[13px] font-bold font-mono text-slate-800">
                            {formatCurrency(tx.total_cost)}
                          </TableCell>

                          <TableCell className="text-[12px] text-slate-600 font-bold">
                            {tx.created_by_name || "-"}
                          </TableCell>

                          <TableCell className="text-[11px] text-slate-500 font-medium">
                            {formatDate(tx.created_at)}
                          </TableCell>

                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* === MOBILE/TABLET CARDS VIEW (Hidden on Desktop) === */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden animate-in fade-in duration-300">
                {transactionsData?.data?.map((tx: any) => (
                  <div key={tx.id} className="bg-white border border-slate-200/70 shadow-sm rounded-2xl p-4 flex flex-col gap-4 hover:shadow-md transition-all">
                    
                    {/* Header: ID & Status & Date */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div className="flex flex-col gap-1.5">
                        <div>
                        {getTransactionBadge(tx.transaction_type)}
                      </div>
                        <span className="font-mono text-[11px] w-fit font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 ">
                          #{tx.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Calendar size={10} /> {formatDate(tx.created_at)}
                        </span>

                      </div>
                      
                    </div>

                    {/* Material Details */}
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-slate-800 leading-tight">{tx.material_name}</span>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        الرمز: <span className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-slate-600">{tx.material_code}</span>
                      </span>
                    </div>

                    {/* Data Grid 2x2 */}
                    <div className="grid grid-cols-2 gap-y-3 gap-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("table.quantity")}</span>
                        <span className={`text-[15px] font-mono font-bold ${tx.transaction_type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.transaction_type === 'IN' ? '+' : '-'}{tx.quantity}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("table.balanceAfter")}</span>
                        <span className="text-[14px] font-mono font-bold text-slate-800">{tx.balance_after}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("table.cost")}</span>
                        <span className="text-[13px] font-mono font-bold text-slate-800">{formatCurrency(tx.total_cost)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("table.user")}</span>
                        <span className="text-[12px] font-bold text-slate-600 flex items-center gap-1">
                          <User size={12} className="text-slate-400" /> {tx.created_by_name || "-"}
                        </span>
                      </div>
                    </div>

                    {/* Source & Notes Footer */}
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("table.source")}:</span>
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {t(`filters.source_${tx.source}`)}
                        </span>
                      </div>
                      {tx.notes && (
                        <div className="flex items-start gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <FileText size={12} className="text-slate-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{tx.notes}</p>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </>
          )}

          {/* ================= PAGINATION ================= */}
          {transactionsData?.pagination && transactionsData.pagination.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 mt-6 border border-slate-200/60 bg-white rounded-2xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-slate-500 font-medium w-full sm:w-auto text-center sm:text-left">
                <div>
                  {t("pagination.page")} <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md mx-1">{transactionsData.pagination.current_page}</span> {t("pagination.of")} <span className="font-bold text-slate-900 mx-1">{transactionsData.pagination.total_pages}</span>
                </div>
                <div className="hidden sm:block border-l border-slate-200 h-4" />
              </div>
              
              <div className="flex gap-2 flex-col md:flex-row w-full sm:w-auto justify-center sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(transactionsData.pagination.current_page - 1)}
                  disabled={transactionsData.pagination.current_page === 1}
                  className="rounded-xl shadow-sm border-slate-200 text-slate-700 font-bold hover:text-slate-900 hover:bg-slate-50 w-full sm:w-auto h-11 px-6"
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(transactionsData.pagination.current_page + 1)}
                  disabled={transactionsData.pagination.current_page === transactionsData.pagination.total_pages}
                  className="rounded-xl shadow-sm border-slate-200 text-slate-700 font-bold hover:text-slate-900 hover:bg-slate-50 w-full sm:w-auto h-11 px-6"
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}