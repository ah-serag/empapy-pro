"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { 
  useGetInvoicesQuery, 
  useUpdateInvoiceStatusMutation, 
} from "@/redux/features/invoicesApiSlice"; 

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, MoreHorizontal, ChevronLeft, ChevronRight, 
  Receipt, MapPin, CalendarDays, User, Phone, CheckCircle, 
  XCircle, Clock, Users, FileText, Banknote
} from "lucide-react";
import { toast } from "sonner";
import { pdf } from '@react-pdf/renderer';
import CopyButton from "@/components/shared/copyButton";
import RefreshButton from "@/components/shared/RefreshButton";

import RecordPaymentModal from "@/components/manager/invoice/RecordPaymentModal";
import { generateInvoicePDF } from "@/lib/pdf/invoicePdf";
import DateFilter from "@/components/shared/DateFilter";
import InvoicePaymentsModal from "@/components/manager/invoice/InvoicePaymentsModal";

export default function InvoicesPage() {
  const t = useTranslations("invoicesPage");
  const locale = useLocale();
  
  // URL Date Params
  const params = useSearchParams();
  const startDate = params.get("startDate") || "";
  const endDate = params.get("endDate") || "";

  // State Management
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 10,
  });

  const queryParams = {
    ...filters,
    start_date: startDate,
    end_date: endDate,
  };

  // Modal States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);

  // 🔴 States for Payment History Modal
  const [isPaymentsHistoryModalOpen, setIsPaymentsHistoryModalOpen] = useState(false);
  const [selectedInvoiceForHistory, setSelectedInvoiceForHistory] = useState<any>(null);

  // API Hooks
  const { data: responseData, isLoading, isError, refetch, isFetching } = useGetInvoicesQuery(queryParams);
  const invoices = responseData?.data || [];
  const pagination = responseData?.pagination;


  // Handlers


  const openPaymentModal = (invoice: any) => {
    setSelectedInvoiceForPayment(invoice);
    setIsPaymentModalOpen(true);
  };

  // 🔴 Handler for Payment History
  const openPaymentsHistoryModal = (invoice: any) => {
    setSelectedInvoiceForHistory(invoice);
    setIsPaymentsHistoryModalOpen(true);
  };


  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const formatCurrency = (amount: string | number) => {
    return Number(amount).toLocaleString(locale, { style: 'currency', currency: 'EGP' });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(locale, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      draft: { 
        label: t("status.draft"), 
        color: "bg-slate-100 text-slate-700 border-slate-200",
        icon: <Clock className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
      },
      unpaid: { 
        label: t("status.unpaid") || "غير مدفوع", 
        color: "bg-rose-50 text-rose-700 border-rose-200",
        icon: <XCircle className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
      },
      partially_paid: { 
        label: t("status.partially_paid") || "مدفوع جزئياً", 
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: <Banknote className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
      },
      paid: { 
        label: t("status.paid"), 
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
      },
      cancelled: { 
        label: t("status.cancelled"), 
        color: "bg-slate-100 text-slate-500 border-slate-200 line-through",
        icon: <XCircle className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
      },
    };
    const config = statusMap[status] || { label: status, color: "bg-slate-50 text-slate-800 border-slate-200", icon: null };
    
    return (
      <Badge className={`${config.color} rounded-full border shadow-sm font-medium px-3 py-1 flex w-fit items-center text-xs`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-6 pl-3 space-y-6 min-h-screen max-w-dvw text-slate-900 bg-[#f8fafc] w-full overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-row  md:flex-row flex-wrap items-center  justify-between  md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div >
          <div className="flex items-center gap-3">
            <div className="bg-white shadow-md border  p-2 rounded-full ">
            <Receipt className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />

            </div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-slate-900">{t("header.title")}</h1>
            {!isLoading && pagination && (
              <Badge className="bg-primary/10 text-primary border-transparent rounded-full font-medium px-3 py-0.5 text-xs shadow-none">
                {pagination.totalItems}
              </Badge>
            )}
          </div>
          <p className="text-slate-500 mt-1 text-sm font-light">{t("header.subtitle")}</p>
        </div>
        <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon" />
      </div>

      {/* Advanced Filters & DateFilter */}
      <div className="flex flex-col gap-4 bg-white border border-slate-200/60 shadow-sm p-6 rounded-2xl w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2 w-full">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 rtl:right-4 rtl:left-auto" />
            <Input
              placeholder={t("filters.searchPlaceholder")}
              className="pl-11 rtl:pr-11 rtl:pl-4 rounded-xl border-slate-200 shadow-sm h-11 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-colors text-slate-900"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
          <div className="w-full">
            <Select onValueChange={(val) => setFilters({ ...filters, status: val === "all" ? "" : val, page: 1 })}>
              <SelectTrigger className="w-full rounded-xl border-slate-200 px-4 shadow-sm h-11 bg-slate-50/50 focus:ring-2 focus:ring-primary/20 text-slate-900">
                <SelectValue placeholder={t("filters.statusFilter")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
                <SelectItem value="all" className="rounded-lg">{t("filters.allStatuses")}</SelectItem>
                <SelectItem value="unpaid" className="rounded-lg">{t("status.unpaid") || "غير مدفوع"}</SelectItem>
                <SelectItem value="partially_paid" className="rounded-lg">{t("status.partially_paid") || "مدفوع جزئياً"}</SelectItem>
                <SelectItem value="paid" className="rounded-lg">{t("status.paid")}</SelectItem>
                <SelectItem value="cancelled" className="rounded-lg">{t("status.cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <DateFilter />
        </div>
      </div>

      {/* Responsive Presentation Area */}
      <div className="w-full">
        {isLoading ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400 font-light shadow-sm">
            {t("table.loading")}
          </div>
        ) : isError ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-red-400 font-light shadow-sm">
            {t("table.error")}
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400 font-light shadow-sm flex flex-col items-center">
            <Receipt className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-light text-base">{t("table.noData")}</p>
          </div>
        ) : (
          <>
            {/* 1. Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {invoices.map((inv: any) => {
                const paidSoFar = inv.paid_amount || 0; 
                
                return (
                <div key={inv.invoice_id} className="bg-white border border-slate-200/60 rounded-2xl flex flex-col gap-4 shadow-sm overflow-hidden space-y-1">
                  
                  {/* Card Header (Invoice Ref & Status) */}
                  <div className="flex justify-between p-5 items-start gap-4 pb-3 bg-slate-50 border-b border-slate-100">
                    <div className="space-y-1">
                      <span className="font-mono text-xs bg-white text-primary px-2.5 py-0.5 rounded-md font-semibold tracking-wide block w-fit border border-slate-200 shadow-sm">
                        {inv.invoice_ref}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 pt-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {formatDate(inv.invoice_date)}
                      </span>
                    </div>
                    <div>{getStatusBadge(inv.invoice_status)}</div>
                  </div>
                  
                  {/* Card Body (Client & Location) */}
                  <div className="space-y-2.5   p-5 text-sm text-slate-600 font-light">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="flex flex-col text-xs sm:text-sm">
                        <span className="font-medium text-slate-800">{inv.contact_name}</span>
                        <span className="text-xs flex items-center gap-1 text-slate-600">{inv.booking_ref} 
                          <CopyButton textToCopy={inv.booking_ref}/>
                        </span>
                        <span className="text-slate-400">{inv.contact_phone}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <p className="line-clamp-2 leading-relaxed text-xs sm:text-sm">{inv.address}</p>
                    </div>
                    <div className="bg-slate-50/70 px-3 py-2 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                      <span className="text-slate-400">الفريق المسؤول:</span>
                      <span className="font-medium text-slate-700">{inv.team_name}</span>
                    </div>
                  </div>

                  {/* Financials Box */}
                  <div className="bg-slate-50/80 p-5 mx-4 rounded-xl border border-slate-100 space-y-1.5 mb-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>الإجمالي الفرعي:</span>
                      <span className="font-medium">{formatCurrency(inv.subtotal)}</span>
                    </div>
                    {Number(inv.discount) > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600">
                        <span>الخصم:</span>
                        <span className="font-medium">- {formatCurrency(inv.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold text-slate-900 pt-1.5 border-t border-slate-200/80 mt-1">
                      <span>الصافي:</span>
                      <span className="text-primary">{formatCurrency(inv.total_amount)}</span>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="pt-2 p-5 flex justify-between items-center gap-2 border-t border-slate-50">
                    
                    <Button 
                      onClick={() => generateInvoicePDF(inv)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl shadow-sm border-slate-200 text-slate-700 hover:text-primary hover:bg-primary/10 h-10 px-4 flex-1 text-xs gap-1.5"
                    >
                      <FileText className="w-4 h-4 text-primary" />
                      تحميل PDF
                    </Button>

                    <Button 
                      onClick={() => openPaymentsHistoryModal(inv)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl shadow-sm border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 h-10 px-4 flex-1 text-xs gap-1.5"
                    >
                      <Banknote className="w-4 h-4" />
                      الدفعات
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-xl shadow-sm border-slate-200 text-slate-600 h-10 w-10 p-0 bg-slate-50 hover:bg-slate-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-slate-200 shadow-xl bg-white p-1">
                        <DropdownMenuLabel className="font-normal text-xs text-slate-400 px-2 py-1.5 uppercase tracking-wider">{t("table.actions")}</DropdownMenuLabel>
                        
                        {(inv.invoice_status === "unpaid" || inv.invoice_status === "partially_paid") && (
                          <DropdownMenuItem onClick={() => openPaymentModal(inv)} className="rounded-lg cursor-pointer text-emerald-700 focus:bg-emerald-50 mb-1">
                            <Banknote className="w-4 h-4 ml-2" /> تسجيل دفعة
                          </DropdownMenuItem>
                        )}
                        

                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )})}
            </div>

            {/* 2. Desktop Table View */}
            <div className="hidden lg:block border border-slate-200/60 bg-white shadow-sm rounded-2xl overflow-hidden w-full">
              <Table className="min-w-[990px]">
                <TableHeader className="bg-slate-50 border-b border-slate-100">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="font-medium text-slate-500 py-4 w-[15%]">{t("table.invoiceInfo")}</TableHead>
                    <TableHead className="font-medium text-slate-500 py-4 w-[25%]">{t("table.clientInfo")}</TableHead>
                    <TableHead className="font-medium text-slate-500 py-4 w-[15%]">{t("table.teamInfo")}</TableHead>
                    <TableHead className="font-medium text-slate-500 py-4 w-[20%]">{t("table.financials")}</TableHead>
                    <TableHead className="font-medium text-slate-500 py-4 w-[13%]">{t("table.status")}</TableHead>
                    <TableHead className="font-medium text-slate-500 py-4  w-[9%] text-center">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv: any) => {
                    const paidSoFar = inv.paid_amount || 0; 

                    return (
                    <TableRow key={inv.invoice_id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      
                      {/* Invoice Info */}
                      <TableCell className="align-middle py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-bold text-primary text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded-md w-fit shadow-sm">{inv.invoice_ref}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1 mt-1"> 
                            <CalendarDays className="w-3.5 h-3.5" /> {formatDate(inv.invoice_date)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Client Info */}
                      <TableCell className="align-middle py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-800 text-sm">{inv.contact_name}</span>                       
                          <span className="text-xs flex items-center gap-1 text-slate-600">{inv.booking_ref} 
                            <CopyButton textToCopy={inv.booking_ref}/>
                          </span>
                          <span className="text-xs text-slate-600">{inv.contact_phone} </span>
                          <span className="text-xs text-slate-500 truncate max-w-[240px]" title={inv.address}>{inv.address}</span>
                        </div>
                      </TableCell>

                      {/* Team Info */}
                      <TableCell className="align-middle py-4">
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                          {inv.team_name}
                        </span>
                      </TableCell>

                      {/* Financials */}
                      <TableCell className="align-middle py-3">
                        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100/80 space-y-1 text-xs w-full max-w-[220px]">
                          <div className="flex justify-between text-slate-500">
                            <span>فرعي:</span>
                            <span className="font-medium">{formatCurrency(inv.subtotal)}</span>
                          </div>
                          {Number(inv.discount) > 0 && (
                            <div className="flex justify-between text-emerald-600">
                              <span>خصم:</span>
                              <span className="font-medium">- {formatCurrency(inv.discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200/60 pt-1.5 mt-1">
                            <span>الصافي:</span>
                            <span className="text-primary">{formatCurrency(inv.total_amount)}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="align-middle py-4">
                        {getStatusBadge(inv.invoice_status)}
                      </TableCell>

                      {/* Actions */}
<TableCell className="align-middle py-4 text-center ">
  <div className="flex items-center  justify-center">
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 rounded-xl hover:bg-slate-100 data-[state=open]:bg-slate-100"
        >
          <MoreHorizontal className="w-5 h-5 text-slate-600" />
          <span className="sr-only">فتح القائمة</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48 rounded-xl">
        {(inv.invoice_status === "unpaid" || inv.invoice_status === "partially_paid") && (
          <DropdownMenuItem 
            onClick={() => openPaymentModal(inv)}
            className="flex items-center gap-2 cursor-pointer p-2.5"
          >
            <Banknote className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium">تسجيل دفعة نقدية</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem 
          onClick={() => openPaymentsHistoryModal(inv)}
          className="flex items-center gap-2 cursor-pointer p-2.5"
        >
          <Receipt className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium">عرض سجل الدفعات</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => generateInvoicePDF(inv)}
          className="flex items-center gap-2 cursor-pointer p-2.5"
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium">تحميل الفاتورة (PDF)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</TableCell>

                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalItems > 0 && (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-200/60 shadow-sm rounded-2xl mt-4">
          <div className="text-sm text-slate-500 font-light text-center lg:text-left rtl:lg:text-right">
            {t("pagination.showing")} <span className="font-medium text-slate-800">{invoices.length}</span> {t("pagination.of")}{" "}
            <span className="font-medium text-slate-800">{pagination.totalItems}</span> {t("pagination.results")}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-light">
              <span>{t("pagination.rows")}:</span>
              <Select value={filters.limit.toString()} onValueChange={(val) => setFilters({ ...filters, limit: parseInt(val), page: 1 })}>
                <SelectTrigger className="h-9 w-[75px] rounded-xl flex px-3 text-center items-center border-slate-200 bg-slate-50/50 shadow-sm text-xs focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
                  <SelectItem value="10" className="rounded-lg text-xs">10</SelectItem>
                  <SelectItem value="20" className="rounded-lg text-xs">20</SelectItem>
                  <SelectItem value="50" className="rounded-lg text-xs">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-50/50 p-1 border border-slate-200/60 rounded-xl shadow-sm">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg text-slate-500 hover:text-primary hover:bg-white bg-transparent disabled:opacity-50" 
                onClick={() => handlePageChange(filters.page - 1)} 
                disabled={filters.page === 1}
              >
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              </Button>
              <div className="text-xs font-medium px-3 text-slate-600">
                {t("pagination.page")} {pagination.currentPage} / {pagination.totalPages}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg text-slate-500 hover:text-primary hover:bg-white bg-transparent disabled:opacity-50" 
                onClick={() => handlePageChange(filters.page + 1)} 
                disabled={filters.page === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* المودال الخاص بتسجيل المدفوعات */}
      <RecordPaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        invoice={selectedInvoiceForPayment} 
        paidSoFar={selectedInvoiceForPayment?.paid_amount || 0}
      />

      <InvoicePaymentsModal 
        isOpen={isPaymentsHistoryModalOpen} 
        onClose={() => setIsPaymentsHistoryModalOpen(false)} 
        invoice={selectedInvoiceForHistory} 
      />

    </div>
  );
}