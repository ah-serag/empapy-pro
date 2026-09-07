"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useGetAllJobExecutionsQuery } from "@/redux/features/JobExecutionApiSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Eye, MapPin, Calendar,
  AlertCircle, CheckCircle, Clock, Briefcase,
  XCircle
} from "lucide-react";

import DateFilter from "@/components/shared/DateFilter";
import RefreshButton from "@/components/shared/RefreshButton";
import CopyButton from "@/components/shared/copyButton";
import ExecutionDetailsModal from "@/components/job/ExecutionDetailsSheet";

export default function JobExecutionsPage() {
  const t = useTranslations("jobExecutions");
  const locale = useLocale();
  const searchParams = useSearchParams();
  
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    limit: 30,
    page: 1,
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const queryParams = {
    ...filters,
    search: debouncedSearch,
    start_date: startDate,
    end_date: endDate,
  };

  const { data: response, isLoading, isFetching, isError, refetch } = useGetAllJobExecutionsQuery(queryParams);
  const [selectedExecution, setSelectedExecution] = useState<any>(null);

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { date: "-", time: "-" };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" }),
      time: date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
    };
  };

 const getStatusBadge = (status: string) => {
  const normalized = status?.toUpperCase();
  
  if (normalized === "NEEDS_REVIEW") {
    return (
      <Badge className="bg-primary shadow-none text-white  w-32  border-slate-200 px-3 py-1 font-medium text-xs rounded-full">
        <AlertCircle size={12} className={`mr-1.5 ${locale === 'ar' ? 'ml-1.5' : ''}`} /> {t("filters.needsReview")}
      </Badge>
    );
  }
  
  if (normalized === "APPROVED") {
    return (
      <Badge className="bg-emerald-50 text-emerald-900 border-slate-200  w-32  px-3 py-1 shadow-none font-medium text-xs rounded-full">
        <CheckCircle size={12} className={`mr-1.5 ${locale === 'ar' ? 'ml-1.5' : ''}`} /> {t("filters.completed")}
      </Badge>
    );
  }

  if (normalized === "IN_PROGRESS") {
    return (
      <Badge className="bg-sky-50 text-sky-900 border-slate-200   w-32 px-3 py-1 shadow-none font-medium text-xs rounded-full">
        <Clock size={12} className={`mr-1.5 ${locale === 'ar' ? 'ml-1.5' : ''}`} /> قيد التنفيذ
      </Badge>
    );
  }

  if (normalized === "REJECTED") {
    return (
      <Badge className="bg-rose-50 text-rose-900 border-slate-200 w-32 px-3 py-1 shadow-none font-medium text-xs rounded-full">
        <XCircle size={12} className={`mr-1.5 ${locale === 'ar' ? 'ml-1.5' : ''}`} /> مردود للفني 
      </Badge>
    );
  }

  return (
    <Badge className="bg-slate-50 text-slate-600 border-slate-200 px-3 py-1 shadow-none font-medium text-xs rounded-full">
      <Clock size={12} className={`mr-1.5 ${locale === 'ar' ? 'ml-1.5' : ''}`} /> {status}
    </Badge>
  );
};

  return (
    <div className="flex flex-col max-w-dvw p-2" dir={locale === "ar" ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row rounded-2xl flex-wrap justify-between items-start md:items-center gap-5 bg-white p-4 border border-slate-200 shadow-sm m-3">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 shrink-0 bg-slate-50 shadow-md  rounded-xl border border-gray-100 flex items-center justify-center text-slate-800">
            <Briefcase size={20} strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-medium text-slate-900 tracking-tight">
                {t("header.title")}
              </h1>
              {!isLoading && response?.pagination && (
                <Badge className="bg-slate-100 text-slate-700 border-none rounded-lg font-medium px-2 py-0.5 text-xs shadow-none">
                  {response.pagination.total}
                </Badge>
              )}
            </div>
            <p className="text-slate-500 mt-1 text-xs">{t("header.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 space-y-4 min-h-screen text-slate-900 w-full overflow-hidden bg-slate-50/30">
        
        {/* Filters */}
        <div className="flex flex-col gap-4 bg-white border border-slate-200 shadow-sm p-5 rounded-2xl w-full">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 w-full">
              <Search className={`absolute ${locale === 'ar' ? 'right-4' : 'left-4'} top-3 h-4 w-4 text-slate-400`} />
              <Input
                placeholder={t("filters.searchPlaceholder")}
                className={`h-10 text-sm ${locale === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} w-full rounded-xl border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300`}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Select onValueChange={(val) => setFilters({ ...filters, status: val === "all" ? "" : val, page: 1 })}>
                <SelectTrigger className="w-full sm:w-[200px] px-4 rounded-xl border-slate-200 shadow-sm h-10 text-sm">
                  <SelectValue placeholder={t("filters.statusFilter")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-sm">
                  <SelectItem value="all" className="text-sm">{t("filters.allStatuses")}</SelectItem>
                  <SelectItem value="NEEDS_REVIEW" className="text-sm">{t("filters.needsReview")}</SelectItem>
                  <SelectItem value="REJECTED" className="text-sm">{t("filters.rejected")}</SelectItem>
                  <SelectItem value="APPROVED" className="text-sm">{t("filters.completed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <DateFilter />
          </div>
        </div>

        {/* Data Container */}
        <div className="w-full">
          {isLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
               {t("table.loading")}
            </div>
          ) : isError ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-sm">
              {t("table.error")}
            </div>
          ) : response?.data?.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
               {t("table.noData")}
            </div>
          ) : (
            <>
              {/* ========================================== */}
              {/* Mobile View (Cards) */}
              {/* ========================================== */}
              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {response.data.map((exec: any) => {
                  const closedAt = formatDateTime(exec.completed_at);
                  return (
                    <div key={exec.execution_id} className="border border-slate-200 rounded-2xl shadow-sm space-y-4 bg-white">
                      
                      <div className="flex items-center bg-slate-50/80 rounded-t-2xl p-4 justify-between border-b border-slate-100">
                        <span className="font-mono text-xs text-slate-800 font-bold tracking-wide flex items-center gap-2">
                          {exec.booking_ref}
                          <CopyButton textToCopy={exec.booking_ref} />
                        </span>
                        <div>{getStatusBadge(exec.execution_status)}</div>
                      </div>

                      <div className="space-y-3 p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-slate-400 uppercase tracking-widest">{t("table.clientInfo")}</span>
                          <span className="text-sm font-semibold text-slate-900">{exec.contact_name}</span>
                          <span className="text-xs font-mono text-slate-500">{exec.contact_phone}</span>
                        </div>
                        
                        <div className="flex flex-col gap-1 pt-2 border-t border-slate-50">
                          <span className="text-[11px] text-slate-400 uppercase tracking-widest">{t("table.address")}</span>
                          <span className="text-xs text-slate-600 truncate">{exec.address}</span>
                        </div>
                        
                        <div className="flex flex-col gap-1 pt-2 border-t border-slate-50">
                          <span className="text-[11px] text-slate-400 uppercase tracking-widest">{t("table.closedAt")}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-800">{closedAt.date}</span>
                            <span className="text-[10px] text-slate-400">{closedAt.time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center p-4 pt-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedExecution(exec)} 
                          className="rounded-xl text-xs gap-2 h-10 w-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-none transition-colors font-semibold"
                        >
                          <Eye className="h-4 w-4" /> {t("buttons.viewDetails")}
                        </Button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* ========================================== */}
              {/* Desktop View (Table) */}
              {/* ========================================== */}
              <div className="hidden lg:block bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden w-full">
                <div className="overflow-x-auto w-full">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                      <TableRow>
                        <TableHead className="font-medium text-center text-slate-500 h-12 text-xs">{t("table.view")}</TableHead>
                        <TableHead className="font-medium text-center text-slate-500 text-xs">{t("table.bookingRef")}</TableHead>
                        <TableHead className="font-medium text-center text-slate-500 text-xs">{t("table.clientInfo")}</TableHead>
                        <TableHead className="font-medium text-center text-slate-500 text-xs">{t("table.address")}</TableHead>
                        <TableHead className="font-medium text-center text-slate-500 text-xs">{t("table.closedAt")}</TableHead>
                        <TableHead className="font-medium text-center text-slate-500 text-xs">{t("table.status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {response.data.map((exec: any) => {
                        const closedAt = formatDateTime(exec.completed_at);
                        return (
                          <TableRow key={exec.execution_id} className="hover:bg-slate-50/50 transition-colors text-center border-b border-slate-100">
                            <TableCell>
                              <Button variant="ghost" onClick={() => setSelectedExecution(exec)} className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                            <TableCell className="font-mono flex items-center justify-center font-medium gap-2 text-slate-800 text-xs pt-3">
                              {exec.booking_ref}
                              <CopyButton textToCopy={exec.booking_ref} />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5 items-center">
                                <span className="text-sm font-medium text-slate-900">{exec.contact_name}</span>
                                <span className="text-xs text-slate-500 font-mono">{exec.contact_phone}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-slate-600 block truncate max-w-[200px] mx-auto">{exec.address}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5 items-center">
                                <span className="text-xs text-slate-800 font-medium">{closedAt.date}</span>
                                <span className="text-xs text-slate-400">{closedAt.time}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(exec.execution_status)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          {/* Pagination */}
          {response?.pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 mt-4 border border-slate-200 bg-white rounded-2xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-500 w-full sm:w-auto text-center sm:text-left">
                <div>
                  {t("pagination.page")} <span className="font-medium text-slate-900">{response.pagination.page}</span> {t("pagination.of")} <span className="font-medium text-slate-900">{response.pagination.total_pages}</span>
                </div>
                <div className="hidden sm:block border-r border-slate-200 h-3" />
                <div>
                  {t("pagination.totalRecords")} <span className="font-medium text-slate-900">{response.pagination.total}</span>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(response.pagination.page - 1)}
                  disabled={response.pagination.page <= 1}
                  className="rounded-xl shadow-none border-slate-200 text-slate-600 hover:text-slate-900 h-8 px-4 text-xs"
                >
                  {t("pagination.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(response.pagination.page + 1)}
                  disabled={response.pagination.page >= response.pagination.total_pages}
                  className="rounded-xl shadow-none border-slate-200 text-slate-600 hover:text-slate-900 h-8 px-4 text-xs"
                >
                  {t("pagination.next")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ExecutionDetailsModal 
        execution={selectedExecution} 
        isOpen={!!selectedExecution} 
        onClose={() => setSelectedExecution(null)} 
      />
    </div>
  );
}