"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// ==========================================
// استيراد الـ Zod Schema من الملف المنفصل
// ==========================================
import { createSafeSchema, type CreateSafeFormValues } from "@/lib/validation/safeValidation";

// ==========================================
// API Hooks
// ==========================================
import { 
  useGetAllSafesQuery, 
  useCreateSafeMutation, 
  useToggleSafeStatusMutation 
} from "@/redux/features/treasurySafesApiSlice";

// ==========================================
// UI Components
// ==========================================
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Wallet, RefreshCcw, Building2, Landmark, UserCircle, CheckCircle, XCircle, Power, CreditCard } from "lucide-react";
import RefreshButton from "@/components/shared/RefreshButton";
import { useGetUsersListQuery } from "@/redux/features/authApiSlice";

export default function SafesPage() {
  const t = useTranslations("treasury");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [filters, setFilters] = useState({ search: "", type: "all" });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Queries & Mutations
  const { data: response, isLoading, isFetching, isError, refetch } = useGetAllSafesQuery(undefined);
  const [createSafe, { isLoading: isCreating }] = useCreateSafeMutation();
  const [toggleStatus, { isLoading: isToggling }] = useToggleSafeStatusMutation();
  
  // جلب بيانات المشرفين فقط
  const { data: supervisorsData, isLoading: isLoadingSupervisors } = useGetUsersListQuery("supervisor");

  // === (حل المشكلة هنا) ضمان أن البيانات مصفوفة لتجنب خطأ .find و .map ===
  const supervisorsList = Array.isArray(supervisorsData) 
    ? supervisorsData 
    : Array.isArray(supervisorsData?.data) 
      ? supervisorsData.data 
      : (supervisorsData ? [supervisorsData] : []);
  // =====================================================================

  // Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search.toLowerCase());
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(createSafeSchema),
    defaultValues: { name: "", type: "MAIN", user_id: undefined },
  });

  const watchType = watch("type");

  const onSubmit = async (data: CreateSafeFormValues) => {
    try {
      await createSafe(data).unwrap();
      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error("Failed to create safe", error);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await toggleStatus({ id, is_active: !currentStatus }).unwrap();
    } catch (error) {
      console.error("Failed to toggle status", error);
    }
  };

  // Data Formatting & Filtering
  const safesList = response?.data || [];
  const filteredData = safesList.filter((safe: any) => {
    const matchesSearch = safe.name.toLowerCase().includes(debouncedSearch);
    const matchesType = filters.type === "all" || safe.type === filters.type;
    return matchesSearch && matchesType;
  });

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { date: "-", time: "-" };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" }),
      time: date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
    };
  };

const getTypeUI = (type: string) => {
    switch (type) {
      case "MAIN": return { icon: <Building2 size={12} />, label: t("types.main") || "خزنة رئيسية", color: "bg-blue-50 text-blue-900 w-30 border-blue-200" };
      case "BANK": return { icon: <Landmark size={12} />, label: t("types.bank") || "حساب بنكي", color: "bg-emerald-50 text-emerald-900 w-30 border-emerald-200" };
      case "TECHNICIAN_WALLET": return { icon: <UserCircle size={12} />, label: t("types.technician") || "عهدة فني", color: "bg-orange-50 w-30 text-orange-900 border-orange-200" };
      case "DIGITAL_WALLET": return { icon: <CreditCard size={12} />, label: t("types.digitalWallet") || "محفظة إلكترونية", color: "bg-purple-50 w-30 text-purple-900 border-purple-200" };
      default: return { icon: <Wallet size={12} />, label: type, color: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };
  return (
    <div className="flex flex-col max-w-dvw p-2" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* ================= Header ================= */}
      <div className="flex flex-col md:flex-row rounded-2xl flex-wrap justify-between items-start md:items-center gap-5 bg-primary  p-4 border border-gray-500 shadow-sm m-3">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 shrink-0 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-primary">
            <Wallet size={20} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-medium text-slate-200 tracking-tight">
                {t("safes.title") || "إدارة الخزن"}
              </h1>
              {!isLoading && response?.data && (
                <Badge className="bg-slate-100 text-slate-700 border-none rounded-lg font-medium px-2 py-0.5 text-xs shadow-none">
                  {response.data.length}
                </Badge>
              )}
            </div>
            <p className="text-slate-200 mt-1 text-xs">{t("safes.subtitle") || "مراقبة الأرصدة وإدارة العهد المالية"}</p>
          </div>
        </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-white rounded-xl  transition-colors">
            <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon" />
          </div>
          
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) reset();
          }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-5 text-sm font-semibold shadow-sm gap-2 bg-white text-secondary hover:bg-slate-50 transition-colors">
                <Plus size={18} /> {t("safes.addBtn") || "خزنة جديدة"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-200 p-0 overflow-hidden shadow-2xl" dir={isRTL ? "rtl" : "ltr"}>
              <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                <DialogTitle className="text-lg font-bold text-secondary flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  {t("safes.createTitle") || "إنشاء خزنة جديدة"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                
                {/* اسم الخزنة */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">{t("form.name") || "اسم الخزنة"}</label>
                  <Input 
                    {...register("name")} 
                    placeholder={t("form.namePlaceholder") || "مثال: الخزنة الرئيسية"} 
                    className="rounded-xl h-11 px-4 border-slate-200 shadow-sm focus-visible:ring-secondary" 
                  />
                  {errors.name && <p className="text-xs text-rose-500 font-medium">{errors.name?.message?.toString()}</p>}
                </div>

                {/* نوع الخزنة */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">{t("form.type") || "نوع الخزنة"}</label>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="rounded-xl h-11 px-4 border-slate-200 shadow-sm focus:ring-secondary">
                          <SelectValue placeholder={t("form.typePlaceholder") || "اختر النوع"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                          <SelectItem value="MAIN" className="py-2.5">{t("types.main") || "خزنة رئيسية"}</SelectItem>
                          <SelectItem value="BANK" className="py-2.5">{t("types.bank") || "حساب بنكي"}</SelectItem>
                          <SelectItem value="TECHNICIAN_WALLET" className="py-2.5">{t("types.technician") || "عهدة فني/مشرف"}</SelectItem>
                       <SelectItem value="DIGITAL_WALLET" className="py-2.5">{t("types.digitalWallet") || "محفظة إلكترونية"}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && <p className="text-xs text-rose-500 font-medium">{errors.type?.message?.toString()}</p>}
                </div>

                {/* اختيار المشرف (يظهر فقط إذا كان النوع عهدة) */}
                {watchType === "TECHNICIAN_WALLET" && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-semibold text-slate-700">المشرف المسؤول عن العهدة</label>
                    <Controller
                      control={control}
                      name="user_id"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                          <SelectTrigger className="rounded-xl h-11 px-4 border-slate-200 shadow-sm focus:ring-secondary" disabled={isLoadingSupervisors}>
                            <SelectValue placeholder={isLoadingSupervisors ? "جاري تحميل المشرفين..." : "اختر المشرف"} />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-60">
                            {/* تغيير supervisorsData?.map إلى supervisorsList.map */}
                            {supervisorsList.map((sup: any) => (
                              <SelectItem key={sup.id} value={sup.id.toString()} className="py-2.5">
                                <span className="font-medium text-sm">{sup.full_name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.user_id && <p className="text-xs text-rose-500 font-medium">{errors.user_id?.message?.toString()}</p>}
                  </div>
                )}

                <DialogFooter className="pt-5 border-t border-slate-100 mt-8">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl text-sm font-medium h-11 px-6 text-slate-600 hover:text-slate-900">
                    {t("common.cancel") || "إلغاء"}
                  </Button>
                  <Button type="submit" disabled={isCreating} className="rounded-xl text-sm font-medium h-11 px-8 shadow-md bg-secondary hover:bg-secondary/90 text-white transition-all">
                    {isCreating ? <RefreshCcw className="h-4 w-4 animate-spin" /> : (t("common.save") || "حفظ الخزنة")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ================= Main Content ================= */}
      <div className="p-3 space-y-4 min-h-screen text-slate-900 w-full overflow-hidden bg-slate-50/30">
        
        {/* Filters */}
        <div className="flex flex-col gap-4 bg-white border border-slate-200 shadow-sm p-5 rounded-2xl w-full">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 w-full">
              <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-3 h-4 w-4 text-slate-400`} />
              <Input
                placeholder={t("filters.searchPlaceholder") || "ابحث باسم الخزنة..."}
                className={`h-10 text-sm ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} w-full rounded-xl border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300`}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Select onValueChange={(val) => setFilters({ ...filters, type: val })}>
                <SelectTrigger className="w-full sm:w-[200px] px-4 rounded-xl border-slate-200 shadow-sm h-10 text-sm">
                  <SelectValue placeholder={t("filters.typeFilter") || "كل الأنواع"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-sm">
                  <SelectItem value="all" className="text-sm">{t("filters.allTypes") || "جميع الخزن"}</SelectItem>
                  <SelectItem value="MAIN" className="text-sm">{t("types.main") || "خزنة رئيسية"}</SelectItem>
                  <SelectItem value="BANK" className="text-sm">{t("types.bank") || "حساب بنكي"}</SelectItem>
                  <SelectItem value="TECHNICIAN_WALLET" className="text-sm">{t("types.technician") || "عهدة فني"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Data Container */}
        <div className="w-full">
          {isLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
               {t("table.loading") || "جاري التحميل..."}
            </div>
          ) : isError ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-sm">
              {t("table.error") || "حدث خطأ أثناء جلب البيانات"}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
               {t("table.noData") || "لا توجد بيانات مطابقة"}
            </div>
          ) : (
            <>
              {/* ================= Mobile View (Cards) ================= */}
              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {filteredData.map((safe: any) => {
                  const createdAt = formatDateTime(safe.created_at);
                  const typeUI = getTypeUI(safe.type);
                  // استخدام supervisorsList للبحث
                  const supervisorName = supervisorsList.find((s: any) => s.id === safe.user_id)?.full_name;
                  
                  return (
                    <div key={safe.id} className={`border border-slate-200 rounded-2xl shadow-sm space-y-4 bg-white transition-opacity ${!safe.is_active && 'opacity-70'}`}>
                      <div className="flex items-center bg-slate-50/80 rounded-t-2xl p-4 justify-between border-b border-slate-100">
                        <span className="font-semibold text-sm text-slate-800 tracking-wide flex items-center gap-2">
                          {safe.name}
                        </span>
                        <Badge className={`${typeUI.color} px-3 py-1 shadow-none font-medium text-xs rounded-full border`}>
                          <span className={`flex items-center gap-1.5`}>
                            {typeUI.icon} {typeUI.label}
                          </span>
                        </Badge>
                      </div>

                      <div className="space-y-3 p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-slate-400 uppercase tracking-widest">{t("table.balance") || "الرصيد الفعلي"}</span>
                          <span className="text-lg font-bold text-slate-900 font-mono">
                            {Number(safe.balance).toLocaleString(locale, { style: 'currency', currency: 'EGP' })}
                          </span>
                        </div>

                        {safe.type === 'TECHNICIAN_WALLET' && supervisorName && (
                          <div className="flex flex-col gap-1 pt-2 border-t border-slate-50">
                            <span className="text-[11px] text-slate-400 uppercase tracking-widest">المشرف المسؤول</span>
                            <span className="text-sm font-semibold text-slate-800">{supervisorName}</span>
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-1 pt-2 border-t border-slate-50">
                          <span className="text-[11px] text-slate-400 uppercase tracking-widest">{t("table.status") || "الحالة"}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            {safe.is_active ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-none shadow-none text-xs rounded-lg px-2">
                                <CheckCircle size={12} className={isRTL ? 'ml-1' : 'mr-1'}/> {t("status.active") || "نشط"}
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-50 text-rose-700 border-none shadow-none text-xs rounded-lg px-2">
                                <XCircle size={12} className={isRTL ? 'ml-1' : 'mr-1'}/> {t("status.inactive") || "موقوف"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center p-4 pt-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={isToggling}
                          onClick={() => handleToggleStatus(safe.id, safe.is_active)} 
                          className={`rounded-xl text-xs gap-2 h-10 w-full border-slate-200 shadow-none transition-colors font-semibold ${safe.is_active ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700' : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
                        >
                          <Power className="h-4 w-4" /> {safe.is_active ? (t("buttons.deactivate") || "إيقاف الخزنة") : (t("buttons.activate") || "تفعيل الخزنة")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ================= Desktop View (Table) ================= */}
              <div className="hidden lg:block bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden w-full">
                <div className="overflow-x-auto w-full">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                      <TableRow>
                        <TableHead className="font-medium text-slate-500 h-12 text-xs w-16">{t("table.id") || "ID"}</TableHead>
                        <TableHead className="font-medium text-slate-500 text-xs">{t("table.name") || "اسم الخزنة"}</TableHead>
                        <TableHead className="font-medium text-center text-slate-500 text-xs">{t("table.type") || "التصنيف"}</TableHead>
                        <TableHead className="font-medium text-center text-slate-500 text-xs">{t("table.balance") || "الرصيد الفعلي"}</TableHead>
                        <TableHead className="font-medium text-center text-slate-500 text-xs">{t("table.status") || "الحالة"}</TableHead>
                        <TableHead className="font-medium text-center text-slate-500 text-xs">{t("table.createdAt") || "تاريخ الإنشاء"}</TableHead>
                        <TableHead className="font-medium text-center text-slate-500 text-xs">{t("table.actions") || "إجراء"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((safe: any) => {
                        const createdAt = formatDateTime(safe.created_at);
                        const typeUI = getTypeUI(safe.type);
                        const supervisorName = supervisorsList.find((s: any) => s.id === safe.user_id)?.full_name;

                        return (
                          <TableRow key={safe.id} className={`hover:bg-slate-50/50 transition-colors text-center border-b border-slate-100 ${!safe.is_active && 'opacity-60 bg-slate-50/30'}`}>
                            <TableCell className="font-mono text-slate-500 text-xs font-medium pl-6 text-right">#{safe.id}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-semibold text-slate-900">{safe.name}</span>
                                {safe.type === 'TECHNICIAN_WALLET' && supervisorName && (
                                  <span className="text-[11px] text-slate-500">م: {supervisorName}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${typeUI.color} px-2.5 w-45  py-1  shadow-md  text-xs rounded-lg border inline-flex items-center mx-auto`}>
                                <span className={`flex items-center  text-center  gap-1.5`}>
                                  {typeUI.icon} {typeUI.label}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono font-bold text-slate-900 text-sm bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                {Number(safe.balance).toLocaleString(locale, { minimumFractionDigits: 2 })}
                              </span>
                            </TableCell>
                            <TableCell>
                              {safe.is_active ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                  <CheckCircle size={14} /> {t("status.active") || "نشط"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                                  <XCircle size={14} /> {t("status.inactive") || "موقوف"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-xs font-medium text-slate-800">{createdAt.date}</span>
                                <span className="text-[10px] text-slate-400">{createdAt.time}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={isToggling}
                                onClick={() => handleToggleStatus(safe.id, safe.is_active)}
                                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors mx-auto ${safe.is_active ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                              >
                                <Power className="h-3.5 w-3.5 mr-1.5 ml-1.5" />
                                {safe.is_active ? (t("buttons.deactivate") || "إيقاف") : (t("buttons.activate") || "تفعيل")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}