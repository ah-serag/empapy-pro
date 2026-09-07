"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  useGetAdvancedBookingsQuery,
  useConfirmBookingMutation,
  useCancelBookingMutation,
  useUpdateBookingStatusMutation,
  useDeleteBookingMutation,
  useUpdateBookingLocationMutation,
} from "@/redux/features/bookingApiSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Plus, Search, Eye, Phone, MapPin, Calendar, CalendarDays } from "lucide-react";
import { toast } from "sonner";

import CreateBookingModal from "@/components/manager/bookings/CreateBookingModal";
import ViewBookingModal from "@/components/manager/bookings/ViewBookingModal";
import CreateAssignmentDialog from "@/components/manager/bookings/CreateAssignmentSection";
import { useSearchParams } from "next/navigation";
import DateFilter from "@/components/shared/DateFilter";
import CopyButton from "@/components/shared/copyButton";
import RefreshButton from "@/components/shared/RefreshButton";

export default function BookingsPage() {
  const t = useTranslations("bookingManager");
  const locale = useLocale();

  const params = useSearchParams();
  const startDate = params.get("startDate") || "";
  const endDate = params.get("endDate") || "";
  
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    payment_status: "",
    source : "" ,
    limit: 20,
    page: 1, 
  });

  const queryParams = {
    ...filters,
    start_date: startDate,
    end_date: endDate,
  };

  // Modal States
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailsCardOpen, setIsDetailsCardOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 

  const [selectedBookingID, setSelectedBookingId] = useState<any>(null);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false); 
  
  // Cancel States
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);

  // Location States
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationInput, setLocationInput] = useState("");

  // Delete States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);

  const { data: bookingsData, isLoading, refetch , isFetching , isError } = useGetAdvancedBookingsQuery(queryParams);
  const [deleteBooking] = useDeleteBookingMutation();
  const [confirmBooking] = useConfirmBookingMutation();
  const [cancelBooking] = useCancelBookingMutation();
  const [updateStatus] = useUpdateBookingStatusMutation();
  const [updateLocation] = useUpdateBookingLocationMutation();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: t("status.pending"), color: "bg-slate-100 text-slate-800 border-slate-200" },
      confirmed: { label: t("status.confirmed"), color: "bg-blue-50 text-blue-900 border-blue-200 font-medium" },
      scheduled: { label: t("status.scheduled"), color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
      in_progress: { label: t("status.in_progress"), color: "bg-cyan-50 text-cyan-800 border-cyan-200" },
      assigned: { label: t("status.assigned"), color: "bg-slate-200 text-slate-800 border-slate-300" },
      completed: { label: t("status.completed"), color: "bg-teal-50 text-teal-800 border-teal-200" },
      cancelled: { label: t("status.cancelled"), color: "bg-red-50 text-red-800 border-red-200" },
      rejected: { label: t("status.rejected"), color: "bg-gray-100 text-gray-500 border-gray-200" },
    };
    const config = statusMap[status] || { label: status, color: "bg-slate-50 text-slate-800 border-slate-200" };
    return <Badge className={`${config.color} hover:${config.color} rounded-full border shadow-sm font-normal px-3 py-1`}>{config.label}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const paymentMap: Record<string, { label: string; color: string }> = {
      unpaid: { label: t("payment.unpaid"), color: "bg-rose-50 text-rose-800 border-rose-200" },
      partial: { label: t("payment.partial"), color: "bg-orange-50 text-orange-800 border-orange-200" },
      paid: { label: t("payment.paid"), color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
      refunded: { label: t("payment.refunded"), color: "bg-slate-100 text-slate-600 border-slate-200" },
    };
    const config = paymentMap[status] || { label: status, color: "bg-slate-50 text-slate-800 border-slate-200" };
    return <Badge className={`${config.color} hover:${config.color} rounded-full border shadow-sm font-normal px-3 py-1`}>{config.label}</Badge>;
  };

  const handleConfirm = async (id: number) => {
    try {
      await confirmBooking({ id, confirmed_by: 1 }).unwrap();
      toast.success(t("toasts.confirmSuccess"));
      if (selectedBooking?.id === id) setIsDetailsCardOpen(false);
    } catch (err) {
      toast.error(t("toasts.confirmError"));
    }
  };

  const openCancelDialog = (id: number) => {
    setBookingToCancel(id);
    setCancelReason("");
    setIsCancelDialogOpen(true);
  };

  const executeCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error(t("toasts.cancelReasonRequired"));
      return;
    }
    try {
      await cancelBooking({ id: bookingToCancel, cancelled_reason: cancelReason }).unwrap();
      toast.success(t("toasts.cancelSuccess"));
      setIsCancelDialogOpen(false);
      if (selectedBooking?.id === bookingToCancel) setIsDetailsCardOpen(false);
    } catch (err) {
      toast.error(t("toasts.cancelError"));
    }
  };

  const openDeleteDialog = (id: number) => {
    setBookingToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (bookingToDelete === null) return;
    try {
      await deleteBooking(bookingToDelete).unwrap();
      toast.success(t("toasts.deleteSuccess"));
      setIsDeleteDialogOpen(false);
      if (selectedBooking?.id === bookingToDelete) setIsDetailsCardOpen(false);
    } catch (err : any) {
      toast.error(err?.data?.message || "Error deleting booking");
    } finally {
      setBookingToDelete(null);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string, type: "status" | "payment_status") => {
    try {
      const payload = type === "status" ? { id, status: newStatus } : { id, payment_status: newStatus };
      await updateStatus(payload).unwrap();
      toast.success(type === "status" ? t("toasts.statusUpdated") : t("toasts.paymentUpdated"));
      setSelectedBooking((prev: any) => ({ ...prev, [type]: newStatus }));
    } catch (err) {
      toast.error(t("toasts.updateError"));
    }
  };

  const openLocationModal = () => {
    setLocationInput(selectedBooking?.location_url || "");
    setIsLocationModalOpen(true);
  };

  const handleUpdateLocation = async () => {
    try {
      await updateLocation({ id: selectedBooking.id, location_url: locationInput }).unwrap();
      toast.success(t("toasts.locationSuccess"));
      setIsLocationModalOpen(false);
      setSelectedBooking((prev: any) => ({ ...prev, location_url: locationInput }));
    } catch (err) {
      toast.error(t("toasts.locationError"));
    }
  };

  const openBookingDetails = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailsCardOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (

     <div className="flex flex-col max-w-dvw p-2">
    <div className="flex flex-col md:flex-row rounded-2xl flex-wrap justify-between items-start md:items-center gap-5 bg-white p-3  border border-gray-200 shadow-md m-3">
  
  <div className="flex    items-center gap-4">
    
    <div className="w-10 h-10 shrink-0 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-primary">
      <CalendarDays size={24} strokeWidth={1.5} />
    </div>
    
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        <h1 className="text-lg md:text-xl font-normal tracking-tight text-primary">
          {t("header.title")}
        </h1>
        {!isLoading && bookingsData?.pagination && (
          <Badge className="bg-primary/5 text-primary border-primary/10 rounded-lg font-bold px-2.5 py-0.5 text-[11px] shadow-none">
            {bookingsData.pagination.totalRecords}
          </Badge>
        )}
      </div>
      <p className="text-slate-400 mt-1 text-sm font-medium">
        {t("header.subtitle")}
      </p>
    </div>
  </div>

  {/* الجزء الأيسر: الأزرار */}
  <div className="flex items-center gap-3 w-full md:w-auto">
    <Button 
      onClick={() => setIsCreateModalOpen(true)}
      className="flex-1 md:flex-none bg-primary    text-white  hover:bg-primary/80  rounded-xl shadow-md border-4 border-primary/20 flex items-center justify-center gap-2 px-6 h-9 transition-all font-semibold text-sm border-none"
    >
      <Plus size={18} strokeWidth={2.5} /> 
      {t("buttons.newBooking")}
    </Button>
    
    <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon" />
  </div>
  
    </div>

       <div className="p-3 space-y-6 min-h-screen text-slate-900 w-full overflow-hidden bg-slate-50/50">
      
      {/* Header */}
       

      {/* Filters & Date Filter */}
      <div className="flex flex-col gap-4 bg-white border border-slate-200/60 shadow-sm p-6 rounded-2xl w-full">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t("filters.searchPlaceholder")}
              className="pl-11 pr-4 w-full rounded-xl border-slate-200 shadow-sm h-11 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Select onValueChange={(val) => setFilters({ ...filters, status: val === "all" ? "" : val, page: 1 })}>
              <SelectTrigger className="w-full sm:w-[200px] px-4 rounded-xl border-slate-200 shadow-sm h-11 bg-slate-50/50 focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder={t("filters.statusFilter")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                <SelectItem value="all" className="rounded-lg">{t("filters.allStatuses")}</SelectItem>
                <SelectItem value="pending" className="rounded-lg">{t("status.pending")}</SelectItem>
                <SelectItem value="confirmed" className="rounded-lg">{t("status.confirmed")}</SelectItem>
                <SelectItem value="scheduled" className="rounded-lg">{t("status.scheduled")}</SelectItem>
                <SelectItem value="in_progress" className="rounded-lg">{t("status.in_progress")}</SelectItem>
                <SelectItem value="assigned" className="rounded-lg">{t("status.assigned")}</SelectItem>
                <SelectItem value="completed" className="rounded-lg">{t("status.completed")}</SelectItem>
                <SelectItem value="cancelled" className="rounded-lg">{t("status.cancelled")}</SelectItem>
                <SelectItem value="rejected" className="rounded-lg">{t("status.rejected")}</SelectItem>
              </SelectContent>
            </Select>

            {/* تم تحديث فلتر حالة الدفع ليشمل الثلاث حالات المطلوبة معاً */}
            <Select onValueChange={(val) => setFilters({ ...filters, payment_status: val === "all" ? "" : val, page: 1 })}>
              <SelectTrigger className="w-full sm:w-[200px] px-4 rounded-xl border-slate-200 shadow-sm h-11 bg-slate-50/50 focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder={t("filters.paymentFilter")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                <SelectItem value="all" className="rounded-lg">{t("filters.allPayments")}</SelectItem>
                <SelectItem value="unpaid" className="rounded-lg">{t("payment.unpaid")}</SelectItem>
                <SelectItem value="partial" className="rounded-lg">{t("payment.partial")}</SelectItem>
                <SelectItem value="paid" className="rounded-lg">{t("payment.paid")}</SelectItem>
                <SelectItem value="refunded" className="rounded-lg">{t("payment.refunded")}</SelectItem>
              </SelectContent>
            </Select>

              <Select onValueChange={(val) => setFilters({ ...filters, source: val === "all" ? "" : val , page: 1 })}>
              <SelectTrigger className="w-full sm:w-[200px] px-4 rounded-xl border-slate-200 shadow-sm h-11 bg-slate-50/50 focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder={"Source"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                <SelectItem value="all" className="rounded-lg">all</SelectItem>
                <SelectItem value="internal_system" className="rounded-lg">internal system</SelectItem>
                <SelectItem value="web" className="rounded-lg">web</SelectItem>
                <SelectItem value="page_booking" className="rounded-lg">page booking</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
         <div className="pt-2 border-t border-slate-100">
          <DateFilter />
        </div>
      </div>

      {/* Extracted Components */}
      <CreateAssignmentDialog 
        booking_id={selectedBookingID} 
        open={isAssignmentOpen} 
        onOpenChange={setIsAssignmentOpen} 
      />

      <CreateBookingModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />

      <ViewBookingModal 
        open={isDetailsCardOpen} 
        onOpenChange={setIsDetailsCardOpen} 
        booking={selectedBooking} 
        onStatusUpdate={handleStatusUpdate}
        onLocationEdit={openLocationModal}
      />

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-2xl shadow-xl border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="font-light text-xl text-red-600">{t("dialogs.cancelTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <p className="text-sm text-slate-500">{t("dialogs.cancelDesc")}</p>
            <Input
              placeholder={t("dialogs.cancelReasonPlaceholder")}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="rounded-xl shadow-sm px-4 border-slate-200 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:border-red-400 h-11"
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} className="rounded-xl shadow-sm border-slate-200 w-full sm:w-auto h-11">{t("buttons.back")}</Button>
            <Button onClick={executeCancel} className="rounded-xl shadow-sm bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto h-11">{t("buttons.confirmCancellation")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Update Dialog */}
      <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-2xl shadow-xl border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="font-light text-xl text-slate-900">{t("dialogs.locationTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <p className="text-sm text-slate-500">{t("dialogs.locationDesc")}</p>
            <Input
              placeholder={t("dialogs.locationPlaceholder")}
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="rounded-xl shadow-sm px-4 border-slate-200 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary h-11"
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsLocationModalOpen(false)} className="rounded-xl shadow-sm border-slate-200 w-full sm:w-auto h-11">{t("buttons.cancel")}</Button>
            <Button onClick={handleUpdateLocation} className="rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-white w-full sm:w-auto h-11">{t("buttons.saveLocation")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-2xl shadow-xl border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="font-medium text-xl text-red-600 pt-2">{t("dialogs.deleteTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-slate-500">{t("dialogs.deleteDesc")}</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl shadow-sm border-slate-200 w-full sm:w-auto h-11">
              {t("buttons.cancel")}
            </Button>
            <Button onClick={executeDelete} className="rounded-xl shadow-sm bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto h-11">
              {t("buttons.permanentlyDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="w-full">
        {isLoading ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400 font-light shadow-sm">
            {t("table.loading")}
          </div>
        ) : isError ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-red-400 font-light shadow-sm">
            {t("table.error")}
          </div>
        ) : bookingsData?.data?.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400 font-light shadow-sm">
            {t("table.noData")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {bookingsData?.data?.map((booking: any) => (
                <div key={booking.id} className="  border border-slate-200/60 rounded-2xl  shadow-sm space-y-4">
                  <div className="flex items-center bg-gray-100 rounded-t-lg p-5 justify-between">
                    <span className="font-mono text-xs bg-slate-100 text-primary px-3 py-1 rounded-lg font-semibold tracking-wide">

                      {booking.booking_ref} 
                    </span>
                    <div className="flex items-center gap-1">
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>

                  <div className="space-y-2  p-5 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{t("table.customer")}</span>
                      <span className="text-sm font-medium text-slate-800">{booking.contact_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{t("table.reference")} / {t("table.location")}</span>
                      <span className="text-xs text-slate-600 truncate max-w-[180px]">
                        {booking.governorate_name || t("table.noLocation")} — {booking.zone_name || t("table.noZone")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{t("table.date")}</span>
                      <span className="text-xs text-slate-600">
                        {booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" }) : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-400">{t("table.payment")}</span>
                      <div>{getPaymentBadge(booking.payment_status)}</div>
                    </div>
                  </div>

                  <div className="flex items-center  p-5 justify-between pt-3 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openBookingDetails(booking)} 
                      className="rounded-xl text-xs gap-1.5 h-9 border-slate-200 text-slate-700"
                    >
                      <Eye className="h-3.5 w-3.5" /> {t("table.view")}
                    </Button>

                    <div className="flex items-center gap-1">
                      {booking.contact_phone && (
                        <a
                          href={`https://wa.me/${booking.contact_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl border-slate-200 text-slate-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-slate-200 shadow-lg bg-white p-1">
                          <DropdownMenuLabel className="font-normal text-xs text-slate-400 px-2 py-1.5 uppercase tracking-wider">
                            {t("table.quickActions")}
                          </DropdownMenuLabel>
                          
                          {booking.status === "pending" && (
                            <DropdownMenuItem onClick={() => handleConfirm(booking.id)} className="cursor-pointer rounded-lg text-slate-700 focus:bg-slate-100">
                              {t("buttons.confirm")}
                            </DropdownMenuItem>
                          )}
                          
                          {booking.status === "confirmed" && (
                            <DropdownMenuItem onClick={() => { setIsAssignmentOpen(true); setSelectedBookingId(booking.id); }} className="cursor-pointer rounded-lg text-emerald-700 focus:bg-emerald-50">
                              {t("buttons.createAssignment")}
                            </DropdownMenuItem>
                          )}
                          
                          {booking.status !== "cancelled" && booking.status !== "completed" && booking.status !== "rejected" && (
                            <DropdownMenuItem onClick={() => openCancelDialog(booking.id)} className="cursor-pointer rounded-lg text-red-600 hover:bg-red-50">
                              {t("buttons.cancelBooking")}
                            </DropdownMenuItem>
                          )}
                          
               
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden lg:block bg-white border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden w-full">
              <div className="overflow-x-auto w-full">
                <Table className="min-w-[1000px]">
                  <TableHeader className="bg-slate-50 border-b border-slate-100">
                    <TableRow>
                      <TableHead className="font-medium text-center text-slate-500 h-14 w-[70px]">{t("table.view")}</TableHead>
                      <TableHead className="font-medium text-center text-slate-500">{t("table.reference")}</TableHead>
                      <TableHead className="font-medium text-center text-slate-500">{t("table.customer")}</TableHead>
                      <TableHead className="font-medium text-center text-slate-500">{t("table.location")}</TableHead>
                      <TableHead className="font-medium text-center text-slate-500">{t("table.date")}</TableHead>
                      <TableHead className="font-medium text-center text-slate-500">{t("table.status")}</TableHead>
                      <TableHead className="font-medium text-center text-slate-500">{t("table.payment")}</TableHead>
                      <TableHead className="font-medium text-center text-slate-500 w-[80px]">{t("table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookingsData?.data?.map((booking: any) => (
                      <TableRow key={booking.id} className="hover:bg-slate-50/50 transition-colors text-center border-b border-slate-100">
                        <TableCell>
                          <Button variant="ghost" onClick={() => openBookingDetails(booking)} className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono flex items-center font-medium gap-2 text-primary text-xs">{booking.booking_ref}
                          <CopyButton textToCopy={booking.booking_ref}  />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 items-center">
                            <span className="text-sm font-medium text-slate-800">{booking.contact_name}</span>
                            <span className="text-xs text-slate-400">{booking.contact_phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 items-center">
                            <span className="text-sm text-slate-700">{booking.governorate_name || t("table.noLocation")}</span>
                            <span className="text-xs text-slate-400">{booking.zone_name || t("table.noZone")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" }) : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>{getPaymentBadge(booking.payment_status)}</TableCell>
                        <TableCell>
                          <div className="flex justify-center ">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-slate-100 text-slate-400">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[180px] p-2 space-y-1 rounded-xl border-slate-200 shadow-xl bg-white ">
                                <DropdownMenuLabel className="font-normal text-xs text-slate-400 px-2 py-1.5 uppercase tracking-wider">
                                  {t("table.quickActions")}
                                </DropdownMenuLabel>
                                
                                {booking.status === "pending" && (
                                  <DropdownMenuItem onClick={() => handleConfirm(booking.id)} className="cursor-pointer rounded-lg text-slate-700 focus:bg-slate-100">
                                    {t("buttons.confirm")}
                                  </DropdownMenuItem>
                                )}
                                
                                {booking.status === "confirmed" && (
                                  <DropdownMenuItem onClick={() => { setIsAssignmentOpen(true); setSelectedBookingId(booking.id); }} className="cursor-pointer rounded-lg text-emerald-700 focus:bg-emerald-50">
                                    {t("buttons.createAssignment")}
                                  </DropdownMenuItem>
                                )}
                                
                                {booking.status !== "cancelled" && booking.status !== "completed" && booking.status !== "rejected" &&  booking.status !== "assigned" && (
                                  <DropdownMenuItem onClick={() => openCancelDialog(booking.id)} className="cursor-pointer rounded-lg text-red-600 focus:bg-red-50">
                                    {t("buttons.cancelBooking")}
                                  </DropdownMenuItem>
                                )}
                                
        
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {/* Pagination Section */}
        {bookingsData?.pagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 mt-4 border border-slate-200/60 bg-white rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-slate-500 font-light w-full sm:w-auto text-center sm:text-left">
              <div>
                {t("pagination.page")} <span className="font-medium text-slate-900">{bookingsData.pagination.currentPage}</span> {t("pagination.of")} <span className="font-medium text-slate-900">{bookingsData.pagination.totalPages}</span>
              </div>
              <div className="hidden sm:block border-l border-slate-200 h-4" />
              <div>
                {t("pagination.totalRecords")} <span className="font-medium text-slate-900">{bookingsData.pagination.totalRecords}</span>
              </div>
            </div>
            
            <div className="flex gap-2 flex-col md:flex-row w-full sm:w-auto justify-center sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(bookingsData.pagination.currentPage - 1)}
                disabled={!bookingsData.pagination.hasPrevPage}
                className="rounded-xl shadow-sm border-slate-200 text-slate-600 hover:text-slate-900 w-full sm:w-auto h-10 px-4"
              >
                {t("pagination.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(bookingsData.pagination.currentPage + 1)}
                disabled={!bookingsData.pagination.hasNextPage}
                className="rounded-xl shadow-sm border-slate-200 text-slate-600 hover:text-slate-900 w-full sm:w-auto h-10 px-4"
              >
                {t("pagination.next")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
     </div>
   
  );
}