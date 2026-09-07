"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Printer, ArrowDownToLine, ArrowUpFromLine, FileText, ChevronRight, ChevronLeft, Wallet, Tags, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Shared Components
import DateFilter from "@/components/shared/DateFilter";
import CopyButton from "@/components/shared/copyButton";
import RefreshButton from "@/components/shared/RefreshButton";
import { useGetVouchersQuery } from "@/redux/features/treasurySafesApiSlice";
import { Link } from "@/i18n/navigation";
import { generateVoucherPDF } from "@/lib/pdf/VouchersPdf";

export default function VouchersListPage() {
  const params = useSearchParams();
  const startDate = params.get("startDate") || "";
  const endDate = params.get("endDate") || "";
  
  const [filters, setFilters] = useState({
    search: "",
    voucher_type: "",
    limit: 15,
    page: 1, 
  });

  const queryParams = {
    ...filters,
    start_date: startDate,
    end_date: endDate,
  };

  const { data: response, isLoading, refetch, isFetching, isError } = useGetVouchersQuery(queryParams);
  const vouchers = response?.data || [];
  const pagination = response?.pagination;

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const getTypeBadge = (type: string) => {
    if (type === 'RECEIPT') {
      return (
        <Badge className="bg-emerald-50 text-emerald-800 shadow-md border border-gray-200 hover:bg-emerald-100 rounded-lg px-2.5 py-1 flex items-center gap-1 font-bold ">
          <ArrowDownToLine size={14} /> سند قبض
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-50 text-rose-800 shadpw-md  shadow-md border border-gray-200 hover:bg-rose-100 rounded-lg px-2.5 py-1 flex items-center gap-1 font-bold ">
        <ArrowUpFromLine size={14} /> سند صرف
      </Badge>
    );
  };

  const handlePrint = (voucherData: any) => {
    generateVoucherPDF(voucherData);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="flex max-w-dvw flex-col p-2" dir="rtl">
      
      <div className="flex flex-col md:flex-row rounded-2xl flex-wrap justify-between items-start md:items-center gap-5 bg-white p-4 border border-slate-200 shadow-sm m-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 bg-slate-50  shadow-md rounded-xl border border-gray-200 flex items-center justify-center text-primary ">
            <FileText size={24} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-lg md:text-xl font-normal tracking-tight text-primary">
                سجل السندات المالية
              </h1>
              {!isLoading && pagination && (
                <Badge className="bg-primary/10 text-primary border-none rounded-lg font-bold px-2.5 py-0.5 text-xs shadow-none">
                  {pagination.total_records}
                </Badge>
              )}
            </div>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              متابعة القيود، سندات القبض والصرف، وتأثيرها على الخزن
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link href="/manager/treasury/create_vouchers" className="flex-1 md:flex-none">
            <Button className="w-full bg-primary text-white hover:bg-primary/90 rounded-xl shadow-md flex items-center justify-center gap-2 px-6 h-11 transition-all font-bold text-sm">
              <Plus size={18} strokeWidth={2.5} /> 
              إصدار سند جديد
            </Button>
          </Link>
          <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon" />
        </div>
      </div>

      <div className="p-3 space-y-6 min-h-screen text-slate-900 w-full overflow-hidden">
        
        {/* 🔹 Filters & Date Filter */}
        <div className="flex flex-col gap-4 bg-white border border-slate-200 shadow-sm p-6 rounded-[2rem] w-full">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute right-4 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="ابحث برقم السند، الخزنة، البند، أو البيان..."
                className="pr-11 pl-4 w-full rounded-xl border-slate-200 shadow-sm h-11 bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary font-medium text-sm"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              />
            </div>

            {/* Type Filter */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Select onValueChange={(val) => setFilters({ ...filters, voucher_type: val === "all" ? "" : val, page: 1 })}>
                <SelectTrigger className="w-full sm:w-[220px] px-4 rounded-xl border-slate-200 shadow-sm h-11 bg-slate-50 focus:ring-2 focus:ring-primary/20 font-medium">
                  <SelectValue placeholder="نوع السند (الكل)" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  <SelectItem value="all" className="rounded-lg font-medium">الكل (قبض وصرف)</SelectItem>
                  <SelectItem value="RECEIPT" className="rounded-lg font-medium text-emerald-700">سندات القبض (إيداع)</SelectItem>
                  <SelectItem value="PAYMENT" className="rounded-lg font-medium text-rose-700">سندات الصرف (دفع)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="pt-2 border-t border-slate-100">
            {/* مكون فلتر التاريخ الخاص بك */}
            <DateFilter /> 
          </div>
        </div>

        {/* 🔹 Data Display */}
        <div className="w-full">
          {isLoading ? (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-12 text-center text-slate-400 font-medium shadow-sm flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={40} />
              جاري تحميل السندات...
            </div>
          ) : isError ? (
            <div className="bg-white border border-red-200 rounded-[2rem] p-12 text-center text-red-500 font-medium shadow-sm">
              حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.
            </div>
          ) : vouchers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-12 text-center text-slate-400 font-medium shadow-sm flex flex-col items-center gap-3">
              <FileText size={48} className="text-slate-200" />
              لا توجد سندات مطابقة للبحث أو الفلاتر المحددة.
            </div>
          ) : (
            <>
              {/* 📱 Mobile View (Cards) */}
              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {vouchers.map((v: any) => (
                  <div key={v.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-0 overflow-hidden">
                    <div className="flex items-center bg-slate-50 border-b border-slate-100 p-4 justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
                          {v.voucher_number}
                        </span>
                        <CopyButton textToCopy={v.voucher_number} />
                      </div>
                      {getTypeBadge(v.voucher_type)}
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Wallet size={14}/> الخزنة</span>
                        <span className="text-sm font-bold text-slate-700">{v.safe_name || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Tags size={14}/> البند</span>
                        <span className="text-sm font-medium text-slate-600">{v.account_name || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">المبلغ</span>
                        <span className="text-lg font-mono font-bold text-slate-900">{Number(v.amount).toLocaleString()} <span className="text-xs">ج.م</span></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">التاريخ</span>
                        <span className="text-xs font-mono text-slate-500">{formatDate(v.voucher_date)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500 leading-relaxed truncate">{v.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-slate-50 border-t border-slate-100 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePrint(v)} 
                        className="rounded-xl text-xs gap-1.5 h-9 border-slate-200 text-slate-700 hover:text-primary hover:bg-primary/10"
                      >
                        <Printer size={16} /> طباعة السند (PDF)
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 💻 Desktop View (Table) */}
              <div className="hidden lg:block bg-white border border-slate-200 shadow-sm rounded-[2rem] overflow-hidden w-full">
                <div className="overflow-x-auto w-full">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                      <TableRow>
                        <TableHead className="font-bold text-slate-500 h-14 whitespace-nowrap">رقم السند</TableHead>
                        <TableHead className="font-bold text-slate-500 whitespace-nowrap">النوع</TableHead>
                        <TableHead className="font-bold text-slate-500 whitespace-nowrap">الخزنة / البند</TableHead>
                        <TableHead className="font-bold text-slate-500 whitespace-nowrap">المبلغ</TableHead>
                        <TableHead className="font-bold text-slate-500 whitespace-nowrap">البيان</TableHead>
                        <TableHead className="font-bold text-slate-500 whitespace-nowrap">التاريخ</TableHead>
                        <TableHead className="font-bold text-slate-500 whitespace-nowrap">الموظف</TableHead>
                        <TableHead className="font-bold text-center text-slate-500 w-[100px] whitespace-nowrap">طباعة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vouchers.map((v: any) => (
                        <TableRow key={v.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                          <TableCell className="font-mono flex items-center font-bold gap-2 text-primary text-xs">
                            {v.voucher_number}
                            <CopyButton textToCopy={v.voucher_number} />
                          </TableCell>
                          <TableCell>{getTypeBadge(v.voucher_type)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-bold text-primary flex items-center gap-1.5"><Wallet size={14} className="text-primary"/> {v.safe_name || '—'}</span>
                              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><Tags size={14} className="text-slate-400"/> {v.account_name || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono font-bold text-base text-primary whitespace-nowrap">
                            {Number(v.amount).toLocaleString()} <span className="text-xs text-slate-400 font-sans">ج.م</span>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-600 max-w-[200px] truncate" title={v.description}>
                            {v.description}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-primary whitespace-nowrap">
                            {formatDate(v.voucher_date)}
                          </TableCell>
                          <TableCell className="text-sm font-bold text-primary whitespace-nowrap">
                            {v.created_by_name}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              onClick={() => handlePrint(v)} 
                              className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                              title="طباعة السند PDF"
                            >
                              <Printer size={20} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          {/* 🔹 Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 mt-4 border border-slate-200 bg-white rounded-2xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-slate-500 font-medium w-full sm:w-auto text-center sm:text-right">
                <div>
                  صفحة <span className="font-bold text-slate-900">{pagination.current_page}</span> من <span className="font-bold text-slate-900">{pagination.total_pages}</span>
                </div>
                <div className="hidden sm:block border-r border-slate-200 h-4" />
                <div>
                  إجمالي السندات: <span className="font-bold text-slate-900">{pagination.total_records}</span>
                </div>
              </div>
              
              <div className="flex gap-2 flex-col md:flex-row w-full sm:w-auto justify-center sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="rounded-xl shadow-sm border-slate-200 text-slate-600 hover:text-slate-900 w-full sm:w-auto h-10 px-4 font-bold"
                >
                  <ChevronRight size={18} className="ml-1" /> السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.total_pages}
                  className="rounded-xl shadow-sm border-slate-200 text-slate-600 hover:text-slate-900 w-full sm:w-auto h-10 px-4 font-bold"
                >
                  التالي <ChevronLeft size={18} className="mr-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}