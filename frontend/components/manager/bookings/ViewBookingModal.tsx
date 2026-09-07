"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Calendar as CalendarIcon, Info, Database, MessageCircle } from "lucide-react";
import CopyButton from "@/components/shared/copyButton";

interface ViewBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onStatusUpdate: (id: number, val: string, type: "status" | "payment_status") => void;
  onLocationEdit: () => void;
}

export default function ViewBookingModal({ 
  open, 
  onOpenChange, 
  booking, 
  onStatusUpdate, 
  onLocationEdit
}: ViewBookingModalProps) {
  
  const t = useTranslations("ViewBookingModal");

  if (!booking) return null;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: t("status.pending"), color: "bg-slate-100 text-slate-800 border-slate-200" },
      confirmed: { label: t("status.confirmed"), color: "bg-blue-50 text-blue-800 border-blue-200" },
      scheduled: { label: t("status.scheduled"), color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
      in_progress: { label: t("status.in_progress"), color: "bg-cyan-50 text-cyan-800 border-cyan-200" },
      completed: { label: t("status.completed"), color: "bg-teal-50 text-teal-800 border-teal-200" },
      cancelled: { label: t("status.cancelled"), color: "bg-red-50 text-red-800 border-red-200" },
      rejected: { label: t("status.rejected"), color: "bg-gray-100 text-gray-500 border-gray-200" },
    };
    const config = statusMap[status] || { label: status, color: "bg-slate-50 text-slate-800 border-slate-200" };
    return <Badge className={`${config.color} hover:${config.color} rounded-full border shadow-sm font-medium px-4 py-1.5`}>{config.label}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const paymentMap: Record<string, { label: string; color: string }> = {
      unpaid: { label: t("paymentStatus.unpaid"), color: "bg-rose-50 text-rose-800 border-rose-200" },
      partial: { label: t("paymentStatus.partial"), color: "bg-orange-50 text-orange-800 border-orange-200" },
      paid: { label: t("paymentStatus.paid"), color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
      refunded: { label: t("paymentStatus.refunded"), color: "bg-slate-100 text-slate-600 border-slate-200" },
    };
    const config = paymentMap[status] || { label: status, color: "bg-slate-50 text-slate-800 border-slate-200" };
    return <Badge className={`${config.color} hover:${config.color} rounded-full border shadow-sm font-medium px-4 py-1.5`}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={true} className="max-w-[95vw]   lg:max-w-[1200px] w-full p-0 rounded-2xl border-slate-200 shadow-2xl bg-gray-100 flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Card Header */}
        <DialogHeader className="p-6 md:p-8    border-b border-slate-100 bg-secondary shrink-0">
          <div className="flex flex-col pt-10 md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-3">
              <DialogTitle className="text-xl md:text-2xl font-light text-white flex flex-wrap items-center gap-3">
                <span>{t("bookingDetails")} :</span>
                <span className="font-mono  flex items-center text-sm bg-white/10 border border-white/20 px-3 py-1 text-white rounded-lg shadow-sm font-normal">
                  {booking.booking_ref}
                 <CopyButton textToCopy={booking.booking_ref}   />

                </span>
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-700 bg-white px-3 py-1 rounded-lg shadow-sm font-medium">
                  {t("created")} : {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : t("null")}
                </span>
                <span className="text-slate-700 bg-white px-3 py-1 rounded-lg shadow-sm font-medium">
                  {booking.created_at ? new Date(booking.created_at).toLocaleTimeString() : t("null")}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {getStatusBadge(booking.status)}
              {getPaymentBadge(booking.payment_status)}
            </div>
          </div>
        </DialogHeader>

        {/* Card Body Grid with proper scrolling */}
        <div className="p-6 md:p-10 bg-gray-100 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          

          {/* 1. Client Info */}
          <div className="space-y-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold bg-secondary py-3 px-4 text-white uppercase tracking-widest flex items-center gap-2 rounded-t-xl">
              <User className="h-4 w-4 shrink-0" /> {t("clientIdentification")}
            </h3>
            <div className="space-y-4 p-5 pt-1">
              <div>
                <span className="block text-xs text-slate-400 mb-1">{t("fullName")}</span>
                <span className="block text-sm font-medium text-slate-900">{booking.contact_name || t("null")}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 mb-1">{t("phoneNumber")}</span>
                <div className="flex items-center gap-3">
                  <span className=" flex items-center gap-1 text-sm font-medium text-slate-900">{booking.contact_phone || t("null")} 
                   <CopyButton textToCopy={booking.contact_phone}   />

                  </span>
                  {booking.contact_phone && (
                    <a
                      href={`https://wa.me/${booking.contact_phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> {t("whatsApp")}
                    </a>
                  )}
                </div>
              </div>
              <div>
                <span className="block text-xs text-slate-400 mb-1">{t("emailAddress")}</span>
                <span className="block text-sm font-medium text-slate-900 break-all">{booking.contact_email || t("null")}</span>
              </div>
            </div>
          </div>

          {/* 2. Logistics & Location */}
          <div className="space-y-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold bg-secondary py-3 px-4 text-white uppercase tracking-widest flex items-center gap-2 rounded-t-xl">
              <MapPin className="h-4 w-4 shrink-0" /> {t("logisticsLocation")}
            </h3>
            <div className="space-y-4 p-5 pt-1">
              <div>
                <span className="block text-xs text-slate-400 mb-1">{t("governorateZone")}</span>
                <span className="block text-sm font-medium text-slate-900">{booking.governorate_name || t("null")} — {booking.zone_name || t("null")}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 mb-1">{t("streetAddress")}</span>
                <span className="block text-sm font-medium text-slate-900 break-words">{booking.address || t("null")}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 mb-1">{t("googleMapsLink")}</span>
                <div className="flex items-center gap-3">
                  {booking.location_url ? (
                    <a href={booking.location_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline text-[12px] break-all  flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {t("openInMaps")}
                    </a>
                  ) : (
                    <span className="text-slate-500 text-sm italic">{t("null")}</span>
                  )}
                  <Button variant="outline" size="sm" onClick={onLocationEdit} className="h-7 text-xs rounded-lg border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 ml-auto">
                    {booking.location_url ? t("editLink") : t("addLink")}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Temporal Data */}
          <div className="space-y-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold bg-secondary py-3 px-4 text-white uppercase tracking-widest flex items-center gap-2 rounded-t-xl">
              <CalendarIcon className="h-4 w-4 shrink-0" /> {t("temporalData")}
            </h3>
            <div className="space-y-4 p-5 pt-1">
              <div>
                <span className="block text-xs text-slate-400 mb-1">{t("preferredDate")}</span>
                <span className="block text-sm font-medium text-slate-900">
                  {booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : t("null")}
                </span>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="block text-xs text-slate-400 mb-1">{t("timeFrom")}</span>
                  <span className="block text-sm font-medium text-slate-900">{booking.preferred_time_from || t("null")}</span>
                </div>
                <div className="flex-1">
                  <span className="block text-xs text-slate-400 mb-1">{t("timeTo")}</span>
                  <span className="block text-sm font-medium text-slate-900">{booking.preferred_time_to || t("null")}</span>
                </div>

              </div>
            </div>
          </div>

          {/* 4. System & Audit Data */}
          <div className="space-y-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold bg-secondary py-3 px-4 text-white uppercase tracking-widest flex items-center gap-2 rounded-t-xl">
              <Database className="h-4 w-4 shrink-0" /> {t("systemAudit")}
            </h3>
            <div className="space-y-4 p-5 pt-1">
              <div>
                <span className="block text-xs text-slate-400 mb-1">{t("bookingId")}</span>
                <span className="block text-sm font-medium text-slate-900">{booking.id || t("null")}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 mb-1">{t("lastUpdatedAt")}</span>
                <span className="block text-sm font-medium text-slate-900">{booking.updated_at ? new Date(booking.updated_at).toLocaleString() : t("null")}</span>
              </div>
                                <div className="flex-1">
                  <span className="block text-xs text-slate-400 mb-1">{t("source")}</span>
                  <span className="block text-sm font-medium text-slate-900">{booking.source || t("null")}</span>
                </div>
            </div>
          </div>

          {/* Remarks Block - Full Width Bottom Row */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white space-y-4 border border-slate-200 rounded-xl shadow-sm">
            <h3 className="text-xs font-bold bg-secondary py-3 px-4 text-white uppercase tracking-widest flex items-center gap-2 rounded-t-xl">
              <Info className="h-4 w-4 shrink-0" /> {t("diagnosticsRemarks")}
            </h3>
            <div className="space-y-4 p-5 pt-1">
              <div>
                <span className="block text-xs text-slate-500 mb-2 font-medium">{t("clientNotes")}</span>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 min-h-[60px] leading-relaxed break-words whitespace-pre-wrap shadow-inner" dir="auto">
                  {booking.notes || <span className="text-slate-400 italic">{t("null")}</span>}
                </div>
              </div>

              <div>
                <span className="block text-xs text-slate-500 mb-2 font-medium">{t("cancellationReason")}</span>
                <div className="bg-red-50/50 leading-relaxed break-words whitespace-pre-wrap border border-red-100 rounded-lg p-4 text-sm text-red-800 font-medium shadow-inner" dir="auto">
                  {booking.cancelled_reason || <span className="text-red-400 italic">{t("null")}</span>}
                </div>
              </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}