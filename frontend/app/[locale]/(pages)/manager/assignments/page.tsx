"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSelector } from "react-redux";
import { 
  useGetAssignmentsQuery, 
  useAssignmentcancelMutation 
} from "@/redux/features/assignmentsApiSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MoreHorizontal, ChevronLeft, ChevronRight, CheckCircle, Clock, PlayCircle, ClipboardList, MapPin, CalendarDays, User, Receipt, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

import CreateInvoiceModal from "@/components/manager/assignments/CreateInvoiceModal";
import DateFilter from "@/components/shared/DateFilter";
import CopyButton from "@/components/shared/copyButton";
import RefreshButton from "@/components/shared/RefreshButton";

export default function AssignmentsPage() {
  const t = useTranslations("assignments");
  const locale = useLocale();

  const currentUser = useSelector((state: any) => state.auth.user);
  const issuedBy = currentUser?.id;

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
  const [assignmentToDelete, setAssignmentToDelete] = useState<number | null>(null);

  // Cancel Modal States
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelAssignmentId, setCancelAssignmentId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelBooking, setCancelBooking] = useState(false); // الحالة الجديدة لإلغاء الحجز

  // Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceAssignmentId, setInvoiceAssignmentId] = useState<number | null>(null);

  // API Hooks
  const { data: responseData, isLoading, isFetching , refetch , isError } = useGetAssignmentsQuery(queryParams);
  const assignments = responseData?.data || [];
  const pagination = responseData?.page ? {
    current_page: responseData.page,
    limit: responseData.limit,
    total_records: responseData.total || assignments.length, 
    total_pages: responseData.total_pages || Math.ceil((responseData.total || assignments.length) / filters.limit) || 1
  } : null;

  const [updateStatus, { isLoading: isUpdatingStatus }] = useAssignmentcancelMutation();

  // Handlers


  // دوال نافذة الإلغاء
  const openCancelDialog = (id: number) => {
    setCancelAssignmentId(id);
    setCancelReason("");
    setCancelError("");
    setCancelBooking(false); // تصفير الحالة عند فتح النافذة
    setIsCancelDialogOpen(true);
  };

  const executeCancel = async () => {
    if (!cancelAssignmentId) return;
    if (!cancelReason.trim()) {
      setCancelError(t("toasts.cancelReasonRequired"));
      return;
    }

    try {
      await updateStatus({ 
        id: cancelAssignmentId, 
        status: "cancelled", 
        cancel_reason: cancelReason,
        cancel_booking: cancelBooking 
      }).unwrap();
      
      toast.success(t("toasts.cancelSuccess"));
      setIsCancelDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || t("toasts.statusError"));
    } finally {
      setCancelAssignmentId(null);
      setCancelReason("");
    }
  };



  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && (!pagination || newPage <= pagination.total_pages)) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const openInvoiceModal = (id: number) => {
    setInvoiceAssignmentId(id);
    setIsInvoiceModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      pending: { 
        label: t("status.pending"), 
        color: "bg-slate-50 text-slate-600 border-slate-200",
        icon: <Clock className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
      },
      in_progress: { 
        label: t("status.in_progress"), 
        color: "bg-sky-50 text-sky-700 border-sky-200",
        icon: <PlayCircle className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
      },
      NEEDS_REVIEW: {
        label: t("status.needs_review"), 
        color: "bg-primary/10 text-primary border border-primary-2 shadow-sm",
        icon: <ClipboardList className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
      },
      completed: { 
        label: t("status.completed"), 
        color: "bg-cyan-50 text-cyan-700 border-cyan-200",
        icon: <CheckCircle className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
      },
      completion_pending: { 
        label: t("status.completion_pending"), 
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <Clock className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
      },
      cancelled: { 
        label: t("status.cancelled"), 
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <AlertCircle className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
      },
    };
    const config = statusMap[status] || { label: status, color: "bg-slate-50 text-slate-800 border-slate-200", icon: null };
    
    return (
      <Badge className={`${config.color} rounded-full border shadow-sm font-medium px-3 py-1 flex w-fit items-center`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(locale, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex-col p-2 max-w-dvw">
       <div className="flex flex-row justify-between  border rounded-2xl shadow-md m-3  items-center flex-wrap gap-4 bg-white   p-4  ">
        <div>
          <div className="flex items-center  gap-3">
            <div className=" rounded-full shadow-md border p-2 ">
            <ClipboardList className="w-7 h-7  sm:w-8 sm:h-8 text-primary" />

            </div>
            <h1 className="text-2xl  font-light tracking-tight text-primary">{t("header.title")}</h1>
            {!isLoading && pagination && (
              <Badge className="bg-primary/10 text-primary border-transparent rounded-full font-medium px-3 py-0.5 text-xs shadow-sm">
                {pagination.total_records}
              </Badge>
            )}
          </div>
          <p className="text-slate-500 mt-1 text-sm font-light">{t("header.subtitle")}</p>
        </div> 
        <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon" />
      </div>
      <div className="p-3 space-y-6 min-h-screen text-slate-900 bg-[#f8fafc] w-full overflow-hidden">
      
      {/* Header */}
     

      {/* Filters & Date Filter Component */}
      <div className="flex flex-col gap-4 bg-white border border-slate-200/60 shadow-sm p-6 rounded-2xl w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2 w-full">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 rtl:right-4 rtl:left-auto" />
            <Input
              placeholder={t("filters.searchPlaceholder")}
              className="pl-11 rtl:pr-11 rtl:pl-4 rounded-xl border-slate-200 shadow-sm h-11 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all text-slate-900"
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
                <SelectItem value="pending" className="rounded-lg">{t("status.pending")}</SelectItem>
                <SelectItem value="in_progress" className="rounded-lg">{t("status.in_progress")}</SelectItem>
                <SelectItem value="NEEDS_REVIEW" className="rounded-lg">{t("status.needs_review")}</SelectItem>

                <SelectItem value="completed" className="rounded-lg">{t("status.completed")}</SelectItem>
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
        ) : assignments.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400 font-light shadow-sm">
            <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-light text-base">{t("table.noData")}</p>
          </div>
        ) : (
          <>
            {/* 1. Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {assignments.map((assignment: any) => (
                <div key={assignment.assignment_id} className="bg-white p-5 border border-slate-200/60 rounded-2xl flex flex-col gap-4 shadow-sm relative overflow-hidden group">
                  
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] sm:text-xs flex items-center gap-1 bg-slate-100 shadow-md text-primary px-2.5 py-1 rounded-md font-semibold tracking-wide">
                          {assignment.assignment_ref} 
                          <CopyButton textToCopy={assignment.assignment_ref}/>
                        </span>
                        <span className="font-mono text-[10px] sm:text-xs flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md font-medium tracking-wide">
                          {assignment.booking_ref} 
                          <CopyButton textToCopy={assignment.booking_ref}/>
                        </span>
                      </div>
                      <h3 className="text-base font-medium text-slate-800 flex items-center gap-2 pt-1">
                        <User className="w-4 h-4 text-slate-400" />
                        {assignment.contact_name}
                      </h3>
                    </div>
                    <div>{getStatusBadge(assignment.assignment_status)}</div>
                  </div>
                  
                  <div className="space-y-2.5 text-sm text-slate-600 font-light border-t border-slate-100 pt-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 text-wrap mt-0.5 shrink-0" />
                      <p className="line-clamp-2 leading-relaxed text-wrap text-xs sm:text-sm">{assignment.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                      <p className="text-xs sm:text-sm">{formatDate(assignment.preferred_date)}</p>
                    </div>
                    <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                      <span className="text-slate-400">{t("table.team")}</span>
                      <span className="font-medium text-slate-700">{assignment.team_name}</span>
                    </div>

                    {assignment.assignment_status === "cancelled" && assignment.cancel_reason && (
                      <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs flex flex-col gap-1.5 mt-2">
                        <span className="text-red-800 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> 
                           سبب الإلغاء : 
                        </span>
                        <p className="text-red-600 w-full text-wrap leading-relaxed ps-1.5">{assignment.cancel_reason}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center gap-2">
                    {assignment.assignment_status === "completed" && (
                      <Button 
                        onClick={() => openInvoiceModal(assignment.assignment_id)}
                        disabled={assignment.is_anvoiced}
                        size="sm" 
                        className="rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-white h-10 flex-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Receipt className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> 
                        {assignment.is_anvoiced ? t("table.invoiceIssued") : t("table.issueInvoice")}
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-slate-200 shadow-xl bg-white p-1">
                        <DropdownMenuLabel className="font-normal text-xs text-slate-400 px-2 py-1.5 uppercase tracking-wider">{t("table.actions")}</DropdownMenuLabel>
          
                        {['pending', 'in_progress'].includes(assignment.assignment_status) && (
                          <DropdownMenuItem onClick={() => openCancelDialog(assignment.assignment_id)} className="rounded-lg cursor-pointer text-red-700 focus:bg-red-50">
                            {t("actions.cancelAssignment")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-slate-100 my-1" />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Desktop Table View */}
            <div className="hidden lg:block border border-slate-200/60 bg-white shadow-sm rounded-2xl overflow-hidden w-full">
           <Table className="min-w-[900px] w-full text-xs">
  <TableHeader className="bg-slate-50 border-b border-slate-100">
    <TableRow className="hover:bg-transparent border-none">
      <TableHead className="font-semibold text-slate-500 py-3 px-3 w-[24%] text-[11px]">{t("table.ref")}</TableHead>
      <TableHead className="font-semibold text-slate-500 py-3 px-3 w-[20%] text-[11px]">{t("table.clientInfo")}</TableHead>
      <TableHead className="font-semibold text-slate-500 py-3 px-3 w-[20%] text-[11px]">{t("table.location")}</TableHead>
      <TableHead className="font-semibold text-slate-500 py-3 px-3 w-[14%] text-[11px]">{t("table.team")}</TableHead>
      <TableHead className="font-semibold text-slate-500 py-3 px-3 w-[14%] text-[11px]">{t("table.date")}</TableHead>
      <TableHead className="font-semibold text-slate-500 py-3 px-3 w-[12%] text-[11px]">{t("table.status")}</TableHead>
      <TableHead className="font-semibold text-slate-500 py-3 px-3 w-[10%] text-right rtl:text-left text-[11px]">{t("table.actions")}</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {assignments.map((assignment: any) => (
      <TableRow key={assignment.assignment_id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
        <TableCell className="align-middle py-3 px-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-primary bg-slate-100 px-2 py-0.5 rounded w-fit flex items-center gap-1 border border-slate-200">
              {assignment.assignment_ref}
              <CopyButton textToCopy={assignment.assignment_ref}/>
            </span>
            <span className="text-[9px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded w-fit flex items-center gap-1 border border-slate-100">
              الحجز: {assignment.booking_ref}
              <CopyButton textToCopy={assignment.booking_ref}/>
            </span>
          </div>
        </TableCell>
        <TableCell className="align-middle py-3 px-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-slate-800 text-xs">{assignment.contact_name}</span>
            {assignment.assignment_status === "cancelled" && assignment.cancel_reason && (
              <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 w-fit truncate max-w-[180px]" title={assignment.cancel_reason}>
                إلغاء: {assignment.cancel_reason}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="align-middle py-3 px-3">
          <div className="flex items-start gap-1.5 max-w-[220px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600 truncate leading-relaxed" title={assignment.address}>
              {assignment.address}
            </p>
          </div>
        </TableCell>
        <TableCell className="align-middle py-3 px-3">
          <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md inline-block truncate max-w-[130px]">
            {assignment.team_name}
          </span>
        </TableCell>
        <TableCell className="align-middle py-3 px-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px]">{formatDate(assignment.preferred_date)}</span>
          </div>
        </TableCell>
        <TableCell className="align-middle py-3 px-3">
          {getStatusBadge(assignment.assignment_status)}
        </TableCell>
        <TableCell className="align-middle py-3 px-3 text-right rtl:text-left">
          <div className="flex items-center justify-end gap-1.5">

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px] rounded-xl border-slate-200 shadow-xl bg-white p-1 text-xs">
                <DropdownMenuLabel className="font-normal text-[10px] text-slate-400 px-2 py-1 uppercase tracking-wider">{t("table.actions")}</DropdownMenuLabel>
                {['pending', 'in_progress'].includes(assignment.assignment_status) && (
                  <DropdownMenuItem onClick={() => openCancelDialog(assignment.assignment_id)} className="rounded-lg cursor-pointer text-red-600 focus:bg-red-50 text-xs py-1.5">
                    {t("actions.cancelAssignment")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-slate-100 my-1" />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
            </div>
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.total_records > 0 && (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-200/60 shadow-sm rounded-2xl mt-4">
          <div className="text-sm text-slate-500 font-light text-center lg:text-left rtl:lg:text-right">
            {t("pagination.showing")} <span className="font-medium text-slate-800">{assignments.length}</span> {t("pagination.of")}{" "}
            <span className="font-medium text-slate-800">{pagination.total_records}</span> {t("pagination.results")}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-light">
              <span>{t("pagination.rows")}:</span>
              <Select value={filters.limit.toString()} onValueChange={(val) => setFilters({ ...filters, limit: parseInt(val), page: 1 })}>
                <SelectTrigger className="h-9 w-[75px] px-4 rounded-xl border-slate-200 bg-slate-50/50 shadow-sm text-xs focus:ring-0">
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
                {t("pagination.page")} {pagination.current_page} / {pagination.total_pages}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg text-slate-500 hover:text-primary hover:bg-white bg-transparent disabled:opacity-50" 
                onClick={() => handlePageChange(filters.page + 1)} 
                disabled={filters.page === pagination.total_pages}
              >
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] p-0 rounded-2xl shadow-2xl border-slate-200 bg-white overflow-hidden">
          <DialogHeader className="bg-red-600 p-6">
            <DialogTitle className="font-medium text-xl text-white">{t("dialogs.deleteTitle")}</DialogTitle>
          </DialogHeader>
          <div className="py-4 px-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed">{t("dialogs.deleteDesc")}</p>
          </div>
          <DialogFooter className="flex-col p-6 pt-2 sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl shadow-sm border-slate-200 bg-white hover:bg-slate-50 text-slate-700 w-full sm:w-auto h-11">
              {t("buttons.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Assignment Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] p-0 rounded-2xl shadow-2xl border-slate-200 bg-white overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader className="bg-red-50 p-6 border-b border-red-100">
            <DialogTitle className="font-medium text-xl text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {t("dialogs.cancelTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 px-6 space-y-4">
            <p className="text-sm text-slate-500 font-light leading-relaxed">
              {t("dialogs.cancelDesc")}
            </p>
            <div>
              <textarea
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  if (cancelError) setCancelError("");
                }}
                placeholder={t("dialogs.cancelReasonPlaceholder")}
                className={`w-full p-3 h-28 rounded-xl border bg-slate-50/50 text-sm focus:outline-none focus:ring-2 transition-colors resize-none ${
                  cancelError ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-slate-100 focus:border-slate-400'
                }`}
              />
              {cancelError && <p className="text-red-500 text-xs mt-1 font-medium">{cancelError}</p>}
            </div>

            {/* Checkbox Box */}
            <label className="flex items-start gap-3 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
              <div className="flex items-center h-5 mt-0.5">
                <input 
                  type="checkbox" 
                  checked={cancelBooking}
                  onChange={(e) => setCancelBooking(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-600 focus:ring-offset-0 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-800">
                  {t("dialogs.cancelBookingLabel")}
                </span>
                <span className="text-xs text-slate-500 font-light leading-relaxed">
                  {t("dialogs.cancelBookingHint")}
                </span>
              </div>
            </label>
            
          </div>
          <DialogFooter className="flex-col p-6 pt-2 sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} disabled={isUpdatingStatus} className="rounded-xl shadow-sm border-slate-200 bg-white hover:bg-slate-50 text-slate-700 w-full sm:w-auto h-11">
              {t("buttons.cancel")}
            </Button>
            <Button onClick={executeCancel} disabled={isUpdatingStatus} className="rounded-xl shadow-sm bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto h-11">
              {isUpdatingStatus ? t("buttons.canceling") : t("buttons.confirmCancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
    </div>
   
  );
}