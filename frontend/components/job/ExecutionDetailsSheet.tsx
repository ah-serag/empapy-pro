"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Wrench, Package, ImageIcon, Banknote, 
  Users, FileText, MapPin, Phone, CalendarCheck, 
  Briefcase, Hash, ZoomIn, CheckCircle2, XCircle, Ban
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useApproveExecutionMutation } from "@/redux/features/JobExecutionApiSlice";
import ApproveExecutionModal, { ApprovePayload } from "./ApproveExecutionModal";
import RejectExecutionModal from "./RejectExecutionModal";

interface Props {
  execution: any;
  isOpen: boolean;
  onClose: () => void;
}

const formatDateTime = (dateString: string, locale: string) => {
  if (!dateString) return { date: "-", time: "-" };
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" }),
    time: date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
  };
};

const calculateDuration = (start: string, end: string, locale: string) => {
  if (!start || !end) return "-";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffInMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));

  if (diffInMinutes < 0) return "-";

  const hours = Math.floor(diffInMinutes / 60);
  const minutes = diffInMinutes % 60;

  if (hours === 0) {
    return locale === "ar" ? `${minutes} دقيقة` : `${minutes} min`;
  } else if (minutes === 0) {
    return locale === "ar" ? `${hours} ساعة` : `${hours} hr`;
  } else {
    return locale === "ar" ? `${hours} س و ${minutes} د` : `${hours}h ${minutes}m`;
  }
};

export default function ExecutionDetailsModal({ execution, isOpen, onClose }: Props) {
  const t = useTranslations("jobExecutions.modal");
  const locale = useLocale();
  
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const [approveExecution, { isLoading: isApproving }] = useApproveExecutionMutation();

  if (!execution) return null;

  const startedAt = formatDateTime(execution.started_at, locale);
  const completedAt = formatDateTime(execution.completed_at, locale);
  const duration = calculateDuration(execution.started_at, execution.completed_at, locale);

  const totalServicesAmount = execution.services?.reduce((acc: number, cur: any) => acc + Number(cur.total_price || 0), 0) || 0;
  const totalMaterialsAmount = execution.materials?.reduce((acc: number, cur: any) => acc + Number(cur.total_price || 0), 0) || 0;
  const grandTotal = totalServicesAmount + totalMaterialsAmount;
  
  const collectedAmount = Number(execution.collected_amount || 0);
  const remainingAmount = Math.max(grandTotal - collectedAmount, 0);

  const beforePhotos = execution.photos?.filter((p: any) => p.stage === "BEFORE") || [];
  const afterPhotos = execution.photos?.filter((p: any) => p.stage === "AFTER") || [];

  const paymentMethodMap: Record<string, string> = {
    CASH: "كاش (نقداً للفني)",
    TRANSFER: "تحويل إلكتروني/بنكي",
    NONE: "بدون دفع الآن"
  };

  const paymentStatusMap: Record<string, { label: string, color: string }> = {
    PAID: { label: "مدفوع بالكامل", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    PENDING: { label: "قيد الانتظار", color: "text-amber-700 bg-amber-50 border-amber-200" },
    UNPAID: { label: "غير مدفوع", color: "text-rose-700 bg-rose-50 border-rose-200" },
    PARTIAL: { label: "مدفوع جزئياً", color: "text-blue-700 bg-blue-50 border-blue-200" } 
  };

  let computedStatus = execution.payment_status;
  if (execution.payment_method === 'CASH') {
      if(collectedAmount >= grandTotal && grandTotal > 0) computedStatus = 'PAID';
      else if(collectedAmount > 0 && collectedAmount < grandTotal) computedStatus = 'PARTIAL';
      else if(collectedAmount === 0 && grandTotal > 0) computedStatus = 'UNPAID';
  }

  const currentPaymentStatus = paymentStatusMap[computedStatus] || { 
    label: computedStatus || "غير محدد", 
    color: "text-slate-700 bg-slate-50 border-slate-200" 
  };

  const isReviewed = execution.execution_status === "APPROVED" || execution.execution_status === "CANCELLED" || execution.execution_status === "REJECTED";
  const isProgress  = execution.execution_status === "DRAFT" || execution.execution_status === "IN_PROGRESS";
  const neadReview =  execution.execution_status === "NEEDS_REVIEW" ;


  const handleConfirmApproval = async (payload: ApprovePayload) => {
    try {
      const response = await approveExecution(payload).unwrap();
      toast.success(response?.message || "تم اعتماد وإقفال المهمة وترحيل الحسابات بنجاح!");
      setShowApproveModal(false);
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || "حدث خطأ أثناء اعتماد المهمة. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleReject = async (execution_id: number) => {
    const confirmReject = window.confirm("هل أنت متأكد من رفض هذه المهمة وإعادتها للفني؟");
    if (!confirmReject) return;
    try {
      toast.success("تم رفض المهمة وإعادتها للفني بنجاح!");
      onClose();
    } catch (error: any) {
      toast.error("حدث خطأ أثناء رفض المهمة.");
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent 
          aria-describedby={undefined}
          className="sm:max-w-2xl md:max-w-3xl p-0 bg-white border-slate-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[88vh] max-h-[88vh]" 
          dir={locale === "ar" ? "rtl" : "ltr"}
        >
          {/* ================= HEADER ================= */}
          <DialogHeader className="p-3.5 sm:p-4 bg-secondary border-b border-slate-200 flex flex-col gap-2.5 items-start justify-start shrink-0">
            <div className="flex items-start gap-2.5 w-full">
              <div className="w-8 h-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-sm">
                <Briefcase size={16} strokeWidth={1.5} className="text-white" />
              </div>

              <div className="flex flex-col gap-0.5 w-full">
                <DialogTitle className="text-sm sm:text-base font-bold text-white leading-tight">
                  {t("title")}
                </DialogTitle>
                
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-white/90 font-mono text-[10px] bg-black/20 px-2 py-0.5 rounded border border-white/10">
                    {execution.booking_ref}
                  </span>
                  
                  {isReviewed && (
                    <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold border shadow-sm flex items-center gap-1", 
                      execution.execution_status === "APPROVED" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-100" : "bg-rose-500/20 border-rose-500/30 text-rose-100"
                    )}>
                      {execution.execution_status === "APPROVED" ? <CheckCircle2 size={11}/> : <Ban size={11}/>}
                      {execution.execution_status === "APPROVED" 
                        ? "تم الإعتماد" 
                        : execution.execution_status === "REJECTED" 
                          ? "تم الرفض" 
                          : "ملغاة"}
                    </div>
                  )}
                </div>

                <p className="text-white/70 text-[10px] mt-0.5 leading-normal">
                  {t("subtitle")}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* ================= BODY ================= */}
          <div className="flex-1 min-h-0 overflow-hidden bg-white">
            <ScrollArea className="h-full w-full" dir={locale === "ar" ? "rtl" : "ltr"}>
              <div className="p-4 sm:p-5 space-y-4 pb-6">

                {/* 1. Client & Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SectionCard title={t("clientInfo")} icon={<Users size={14} className="text-slate-700" />}>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2.5 text-slate-900">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0"><Users size={12} className="text-slate-500" /></div>
                        <span className="font-bold">{execution.contact_name}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0"><Phone size={12} className="text-slate-500" /></div>
                        <span className="font-mono font-bold text-[11px]">{execution.contact_phone}</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-slate-600">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5"><MapPin size={12} className="text-slate-500" /></div>
                        <span className="font-medium leading-relaxed">{execution.address}</span>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title={t("timeline")} icon={<CalendarCheck size={14} className="text-slate-700" />}>
                     <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center items-center text-center">
                        <span className="text-[9px] text-slate-500 mb-0.5 block font-bold">{t("startTime")}</span>
                        <p className="text-xs font-bold text-slate-900">{startedAt.time}</p>
                        <p className="text-[8px] text-slate-400 mt-0.5">{startedAt.date}</p>
                      </div>
                      <div className="p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center items-center text-center">
                        <span className="text-[9px] text-slate-500 mb-0.5 block font-bold">{t("closeTime")}</span>
                        <p className="text-xs font-bold text-slate-900">{completedAt.time}</p>
                        <p className="text-[8px] text-slate-400 mt-0.5">{completedAt.date}</p>
                      </div>
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-center items-center text-center">
                        <span className="text-[9px] text-slate-600 mb-0.5 block font-bold">الاستغراق</span>
                        <p className="text-xs font-black text-slate-800">{duration}</p>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                {/* 2. Financials & Payment Solution */}
                <SectionCard title="الماليات وحالة الدفع" icon={<Banknote size={14} className="text-slate-700" />}>
                  <div className="flex items-center justify-between p-3 mb-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold mb-0.5">إجمالي الحساب (خدمات + خامات)</p>
                      <p className="text-base font-black text-slate-900">{grandTotal} <span className="text-[10px] text-slate-600 font-medium">ج.م</span></p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <Banknote size={16} className="text-slate-700"/>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="space-y-2.5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">طريقة الدفع:</span>
                        <span className="text-[11px] font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 w-fit">
                          {paymentMethodMap[execution.payment_method] || execution.payment_method || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">حالة الدفع:</span>
                        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-md border w-fit", currentPaymentStatus.color)}>
                          {currentPaymentStatus.label}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 rounded-md border border-emerald-100 bg-emerald-50">
                        <span className="text-[11px] font-bold text-emerald-800">المحصل الفعلي:</span>
                        <span className="text-xs font-black text-emerald-900">{collectedAmount} ج.م</span>
                      </div>
                      <div className={cn("flex justify-between items-center p-2 rounded-md border", 
                        remainingAmount > 0 ? "border-rose-100 bg-rose-50" : "border-slate-100 bg-slate-55"
                      )}>
                        <span className={cn("text-[11px] font-bold", remainingAmount > 0 ? "text-rose-800" : "text-slate-500")}>المتبقي:</span>
                        <span className={cn("text-xs font-black", remainingAmount > 0 ? "text-rose-900" : "text-slate-700")}>{remainingAmount} ج.م</span>
                      </div>
                    </div>
                  </div>

                  {Number(execution.additional_expenses) > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
                      <p className="text-[10px] text-slate-500 font-bold mb-1.5">مصروفات إضافية (من العهدة)</p>
                      <div className="p-2.5 rounded-md border border-slate-200 bg-slate-50 flex justify-between items-center">
                        <span className="text-[11px] text-slate-600 truncate pr-3">{execution.expenses_reason || "بدون ملاحظات"}</span>
                        <span className="text-xs font-black text-slate-800 shrink-0">{execution.additional_expenses} ج.م</span>
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* 3. Team */}
                <SectionCard title={t("team")} icon={<Users size={14} className="text-slate-700" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {execution.team_members?.map((member: any) => (
                      <div key={member.member_id} className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold shrink-0">
                          {member.name ? member.name.charAt(0) : "ف"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-xs truncate">{member.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate" dir="ltr">{member.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* 4. Services (Compact List instead of Table) */}
                {execution.services?.length > 0 && (
                  <SectionCard title={t("services")} icon={<Wrench size={14} className="text-slate-700" />}>
                    <div className="space-y-2">
                      {execution.services.map((service: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                              <Wrench size={10} className="text-slate-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 truncate">{service.name_ar}</p>
                              <p className="text-[10px] text-slate-500">الكمية: {service.quantity} × {Number(service.unit_price)} {t("currency")}</p>
                            </div>
                          </div>
                          <div className="text-left shrink-0 font-mono font-black text-slate-900 pr-2">
                            {Number(service.total_price)} {t("currency")}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold">
                        <span className="text-slate-700">{t("totalServices")}</span>
                        <span className="font-black text-slate-900 font-mono">{totalServicesAmount} {t("currency")}</span>
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* 5. Materials (Compact List instead of Table) */}
                {execution.materials?.length > 0 && (
                  <SectionCard title={t("materials")} icon={<Package size={14} className="text-slate-700" />}>
                    <div className="space-y-2">
                      {execution.materials.map((mat: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                              <Package size={10} className="text-slate-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 truncate">{mat.name_ar}</p>
                              <p className="text-[10px] text-slate-500">الكمية: {mat.quantity} × {Number(mat.unit_price)} {t("currency")}</p>
                            </div>
                          </div>
                          <div className="text-left shrink-0 font-mono font-black text-slate-900 pr-2">
                            {Number(mat.total_price)} {t("currency")}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold">
                        <span className="text-slate-700">{t("totalMaterials")}</span>
                        <span className="font-black text-slate-900 font-mono">{totalMaterialsAmount} {t("currency")}</span>
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* 6. Notes */}
                {execution.tech_notes && (
                  <SectionCard title={t("notes")} icon={<FileText size={14} className="text-slate-700" />}>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <p className="text-slate-700 leading-relaxed text-xs font-medium">
                        {execution.tech_notes}
                      </p>
                    </div>
                  </SectionCard>
                )}

                {/* 7. Photos */}
                {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {beforePhotos.length > 0 && (
                      <SectionCard title="صور قبل العمل" icon={<ImageIcon size={14} className="text-slate-700" />}>
                        <div className="grid grid-cols-3 gap-2">
                          {beforePhotos.map((photo: any, index: number) => (
                            <div 
                              key={index} 
                              onClick={() => setEnlargedImage(photo.url)}
                              className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer group shadow-sm hover:border-slate-400 transition-colors"
                            >
                              <Image src={photo.url} alt={`Before ${index + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized={true} />
                            </div>
                          ))}
                        </div>
                      </SectionCard>
                    )}
                    {afterPhotos.length > 0 && (
                      <SectionCard title="صور بعد العمل" icon={<ImageIcon size={14} className="text-slate-700" />}>
                        <div className="grid grid-cols-3 gap-2">
                          {afterPhotos.map((photo: any, index: number) => (
                            <div 
                              key={index} 
                              onClick={() => setEnlargedImage(photo.url)}
                              className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer group shadow-sm hover:border-slate-400 transition-colors"
                            >
                              <Image src={photo.url} alt={`After ${index + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized={true} />
                            </div>
                          ))}
                        </div>
                      </SectionCard>
                    )}
                  </div>
                )}

              </div>
            </ScrollArea>
          </div>

          {/* ================= FOOTER ================= */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0">

            
            {neadReview ?   (



               <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full">



                 <button 
                   onClick={() => setIsRejectModalOpen(true)}
                   className="w-full sm:w-auto bg-red-950 border  text-white px-4 py-2 rounded-xl font-bold text-xs  transition-colors flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                 >
                   <Ban size={14} /> <span>رفض وإعادة للفني</span>
                 </button>

                 <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                 
                   
                  <button 
                     type="button" 
                     onClick={onClose}
                     className="w-full sm:w-auto h-9 px-4 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                   >
                     <XCircle size={14} /> <span>إغلاق</span>
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setShowApproveModal(true)} 
                     className="w-full sm:w-auto h-9 px-5 rounded-xl text-xs font-bold bg-secondary text-white hover:bg-secondary/90 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                   >
                     <CheckCircle2 size={14} /> <span>مراجعة وتأكيد الاعتماد</span>
                   </button>
                 </div>
               </div>
            ) : (
               <div className="flex justify-end w-full">
                 <button 
                   type="button" 
                   onClick={onClose}
                   className="w-full sm:w-auto h-9 px-6 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                 >
                   <XCircle size={14} /> <span>إغلاق</span>
                 </button>
               </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* مودال تكبير الصور */}
      <Dialog open={!!enlargedImage} onOpenChange={() => setEnlargedImage(null)}>
        <DialogContent 
          aria-describedby={undefined}
          className="max-w-4xl border-none bg-transparent shadow-none p-0 flex justify-center items-center [&>button]:text-white [&>button]:bg-black/50 [&>button]:hover:bg-black/70 [&>button]:rounded-full [&>button]:p-1"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{t("photos")}</DialogTitle>
          </DialogHeader>
          {enlargedImage && (
            <div className="relative w-full max-h-[85vh] aspect-square md:aspect-auto md:h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/80">
              <Image 
                src={enlargedImage} 
                alt="Enlarged view" 
                fill 
                className="object-contain"
                unoptimized={true}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* مودال الاعتماد */}
      {showApproveModal && (
        <ApproveExecutionModal 
          execution={execution}
          grandTotal={grandTotal}
          isOpen={showApproveModal} 
          onClose={() => setShowApproveModal(false)}
          onConfirm={handleConfirmApproval}
          onReject={handleReject}
          isLoading={isApproving}
        />
      )}

      {/* مودال الرفض */}
      <RejectExecutionModal 
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        executionId={execution?.execution_id || execution?.id} 
        bookingRef={execution.booking_ref}
      />
    </>
  );
}

function SectionCard({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2.5 flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-bold text-slate-800 tracking-wide">{title}</h3>
      </div>
      <div className="p-3.5 bg-white">
        {children}
      </div>
    </div>
  );
}