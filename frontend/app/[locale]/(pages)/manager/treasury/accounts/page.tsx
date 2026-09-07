"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";


import { createAccountSchema, type CreateAccountFormValues } from "@/lib/validation/accountValidation";


import { 
  useGetAllAccountsQuery, 
  useCreateAccountMutation 
} from "@/redux/features/treasurySafesApiSlice";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, BookOpen, RefreshCcw, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight } from "lucide-react";
import RefreshButton from "@/components/shared/RefreshButton";

export default function AccountsPage() {
  const t = useTranslations("treasury");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [filters, setFilters] = useState({ search: "", type: "all" });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Queries & Mutations
  const { data: response, isLoading, isFetching, isError, refetch } = useGetAllAccountsQuery(undefined);
  const [createAccount, { isLoading: isCreating }] = useCreateAccountMutation();

  // Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search.toLowerCase());
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.search]);

  // Form Setup
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { code: "", name: "", type: "" },
  });

  const onSubmit = async (data: CreateAccountFormValues) => {
    try {
      await createAccount(data).unwrap();
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      console.error("Failed to create account", error);
    }
  };

  // Filtering
  const accountsList = response?.data || [];
  const filteredData = accountsList.filter((acc: any) => {
    const searchMatch = 
      acc.name.toLowerCase().includes(debouncedSearch) || 
      acc.code.toLowerCase().includes(debouncedSearch);
    const typeMatch = filters.type === "all" || acc.type === filters.type;
    return searchMatch && typeMatch;
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
      case "REVENUE": 
        return { icon: <ArrowUpRight size={14} />, label: t("accounts.types.revenue") || "إيراد", color: "bg-emerald-50 shadow-md border border-gray-200 text-emerald-700 border-emerald-200" };
      case "EXPENSE": 
        return { icon: <ArrowDownRight size={14} />, label: t("accounts.types.expense") || "مصروف", color: "bg-rose-50 text-rose-800 shadow-md border border-gray-200" };
      default: 
        return { icon: <BookOpen size={14} />, label: type, color: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="flex max-w-dvw flex-col p-2" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* ================= Header (White & Elegant) ================= */}
      <div className="flex flex-col md:flex-row rounded-2xl flex-wrap justify-between items-start md:items-center gap-5 bg-white p-5 shadow-sm m-3 border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 bg-slate-50 shadow-md  rounded-xl border border-gray-200 flex items-center justify-center text-primary">
            <BookOpen size={22} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-normal text-primary tracking-tight">
                {t("accounts.title") || "دليل الحسابات"}
              </h1>
              {!isLoading && response?.data && (
                <Badge className="bg-slate-100 text-slate-700 border-none rounded-lg font-medium px-2.5 py-0.5 text-xs shadow-none">
                  {response.data.length}
                </Badge>
              )}
            </div>
            <p className="text-slate-500 mt-1 text-sm font-medium">{t("accounts.subtitle") || "إدارة بنود الإيرادات والمصروفات"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-50/50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100">
            <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon" />
          </div>
          
        <Dialog open={isModalOpen} onOpenChange={(open) => {
  setIsModalOpen(open);
  if (!open) reset();
}}>
  <DialogTrigger asChild>
    <Button className="rounded-xl h-11 px-4 sm:px-6 text-sm font-semibold shadow-sm gap-2 bg-primary hover:bg-primary/90 text-white transition-all">
      <Plus size={18} /> <span className="hidden sm:inline">{t("accounts.addBtn") || "حساب جديد"}</span><span className="sm:hidden">جديد</span>
    </Button>
  </DialogTrigger>
  
  <DialogContent 
    className="w-[95vw] sm:max-w-[425px] rounded-2xl sm:rounded-[2rem] border-slate-200 p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col" 
    dir={isRTL ? "rtl" : "ltr"}
  >
    <DialogHeader className="p-5 sm:p-6 pb-4 sm:pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
      <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-slate-600" />
        {t("accounts.createTitle") || "إنشاء حساب جديد"}
      </DialogTitle>
    </DialogHeader>
    
    <div className="flex-1 overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
        
        {/* كود الحساب */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs sm:text-[13px] font-medium text-slate-700 px-1">{t("accounts.code") || "كود الحساب"}</label>
          <Input 
            {...register("code")} 
            placeholder={t("accounts.codePlaceholder") || "مثال: 4001"} 
            className="rounded-xl h-11 sm:h-12 px-4 border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white shadow-sm focus-visible:ring-1 focus-visible:ring-slate-400 font-mono transition-all text-sm" 
          />
          {errors.code && <p className="text-[10px] sm:text-[11px] text-rose-500 font-medium px-1">{errors.code.message as string}</p>}
        </div>

        {/* اسم الحساب */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs sm:text-[13px] font-medium text-slate-700 px-1">{t("accounts.name") || "اسم البند"}</label>
          <Input 
            {...register("name")} 
            placeholder={t("accounts.namePlaceholder") || "مثال: إيرادات صيانة"} 
            className="rounded-xl h-11 sm:h-12 px-4 border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white shadow-sm focus-visible:ring-1 focus-visible:ring-slate-400 transition-all text-sm" 
          />
          {errors.name && <p className="text-[10px] sm:text-[11px] text-rose-500 font-medium px-1">{errors.name.message as string}</p>}
        </div>

        {/* نوع الحساب */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs sm:text-[13px] font-medium text-slate-700 px-1">{t("accounts.type") || "النوع"}</label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="rounded-xl h-11 sm:h-12 px-4 border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white shadow-sm focus:ring-1 focus:ring-slate-400 transition-all text-sm">
                  <SelectValue placeholder={t("accounts.typePlaceholder") || "اختر النوع"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  <SelectItem value="REVENUE" className="py-2.5 cursor-pointer text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-emerald-600" /> {t("accounts.types.revenue") || "إيراد"}
                    </div>
                  </SelectItem>
                  <SelectItem value="EXPENSE" className="py-2.5 cursor-pointer text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={14} className="text-rose-600" /> {t("accounts.types.expense") || "مصروف"}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && <p className="text-[10px] sm:text-[11px] text-rose-500 font-medium px-1">{errors.type.message as string}</p>}
        </div>

        <DialogFooter className="pt-4 sm:pt-6 mt-2 sm:mt-4">
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 w-full">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl text-sm font-semibold h-11 px-6 w-full sm:w-auto text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              {t("common.cancel") || "إلغاء"}
            </Button>
            <Button type="submit" disabled={isCreating} className="rounded-xl text-sm font-semibold h-11 px-8 w-full sm:w-auto shadow-sm bg-slate-900 hover:bg-slate-800 text-white transition-all">
              {isCreating ? <RefreshCcw className="h-4 w-4 animate-spin" /> : (t("common.save") || "حفظ")}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </div>
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
              <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-3.5 h-4 w-4 text-slate-400`} />
              <Input
                placeholder={t("filters.searchPlaceholder") || "ابحث بالكود أو الاسم..."}
                className={`h-11 text-sm ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} w-full rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white shadow-sm focus-visible:ring-1 focus-visible:ring-slate-400 transition-all`}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Select onValueChange={(val) => setFilters({ ...filters, type: val })}>
                <SelectTrigger className="w-full sm:w-[200px] px-4 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white shadow-sm h-11 text-sm focus:ring-1 focus:ring-slate-400 transition-all">
                  <SelectValue placeholder={t("filters.typeFilter") || "كل الأنواع"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-sm">
                  <SelectItem value="all" className="text-sm py-2 cursor-pointer">جميع الحسابات</SelectItem>
                  <SelectItem value="REVENUE" className="text-sm py-2 cursor-pointer">{t("accounts.types.revenue") || "إيراد"}</SelectItem>
                  <SelectItem value="EXPENSE" className="text-sm py-2 cursor-pointer">{t("accounts.types.expense") || "مصروف"}</SelectItem>
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
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-rose-500 text-sm">
              {t("table.error") || "حدث خطأ أثناء جلب البيانات"}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
               {t("table.noData") || "لا توجد حسابات مطابقة"}
            </div>
          ) : (
            <>
              {/* ================= Mobile View (Cards) ================= */}
              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {filteredData.map((acc: any) => {
                  const createdAt = formatDateTime(acc.created_at);
                  const typeUI = getTypeUI(acc.type);
                  
                  return (
                    <div key={acc.id} className="border border-slate-200 rounded-2xl shadow-sm space-y-4 bg-white hover:border-slate-300 transition-colors">
                      <div className="flex items-center bg-slate-50/80 rounded-t-2xl p-4 justify-between border-b border-slate-100">
                        <span className="font-mono text-sm font-bold text-slate-800 tracking-wide flex items-center gap-2">
                          #{acc.code}
                        </span>
                        <Badge className={`${typeUI.color} px-3 py-1 shadow-none font-medium text-xs rounded-full border`}>
                          <span className={`flex items-center gap-1.5`}>
                            {typeUI.icon} {typeUI.label}
                          </span>
                        </Badge>
                      </div>

                      <div className="space-y-3 p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">{t("accounts.name") || "اسم الحساب"}</span>
                          <span className="text-base font-bold text-slate-900">
                            {acc.name}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 pt-3 border-t border-slate-50">
                          <span className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">{t("table.createdAt") || "تاريخ الإنشاء"}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold text-slate-800">{createdAt.date}</span>
                            <span className="text-xs text-slate-400">{createdAt.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ================= Desktop View (Table) ================= */}
              <div className="hidden lg:block bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden w-full">
                <div className="overflow-x-auto w-full">
                  <Table className="min-w-[800px]">
                    <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-slate-600 h-12 text-xs w-32 text-right pl-6">{t("accounts.code") || "كود الحساب"}</TableHead>
                        <TableHead className="font-semibold text-slate-600 text-xs text-right">{t("accounts.name") || "اسم البند"}</TableHead>
                        <TableHead className="font-semibold text-center text-slate-600 text-xs w-40">{t("accounts.type") || "النوع"}</TableHead>
                        <TableHead className="font-semibold text-center text-slate-600 text-xs w-48">{t("table.createdAt") || "تاريخ الإنشاء"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((acc: any) => {
                        const createdAt = formatDateTime(acc.created_at);
                        const typeUI = getTypeUI(acc.type);

                        return (
                          <TableRow key={acc.id} className="hover:bg-slate-50/60 transition-colors text-center border-b border-slate-100 group">
                            <TableCell className="font-mono text-slate-600 group-hover:text-slate-900 text-sm font-bold pl-6 text-right transition-colors">
                              {acc.code}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm font-semibold text-slate-900">{acc.name}</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${typeUI.color} px-3 py-1 shadow-none font-medium text-xs rounded-lg border inline-flex items-center mx-auto transition-colors`}>
                                <span className={`flex items-center gap-1.5`}>
                                  {typeUI.icon} {typeUI.label}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-xs font-semibold text-slate-800">{createdAt.date}</span>
                                <span className="text-[11px] text-slate-400">{createdAt.time}</span>
                              </div>
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