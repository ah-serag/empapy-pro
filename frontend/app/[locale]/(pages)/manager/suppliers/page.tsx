"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Plus, Search, Phone, Building2, User, Wallet, Edit2, Loader2 } from "lucide-react";

import SupplierFormModal from "@/components/manager/suppliers/SupplierFormModal";
import RefreshButton from "@/components/shared/RefreshButton";
import { useGetSuppliersQuery } from "@/redux/features/supplierApiSlice";

export default function SuppliersPage() {
  const t = useTranslations("suppliersManager");
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Filters State
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    limit: 20,
    page: 1,
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  // API Call (For Table Data)
  const { data: suppliersData, isLoading, refetch, isFetching, isError } = useGetSuppliersQuery(filters);

  // Helpers
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const openAddModal = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }).format(amount || 0);
  };

  return (
    <div className="flex flex-col p-2 lg:p-4 max-w-dvw min-h-screen bg-slate-50/50" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row bg-primary rounded-2xl flex-wrap justify-between items-start md:items-center gap-5 p-5 sm:p-6 shadow-md mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 bg-white/10 rounded-xl flex items-center justify-center text-white">
            <Building2 size={24} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-normal tracking-tight text-white">
                {t("header.title")}
              </h1>
              {!isLoading && suppliersData?.pagination && (
                <Badge className="bg-white text-primary rounded-lg font-bold px-3 py-0.5 text-[12px] shadow-sm">
                  {suppliersData.pagination.totalRecords}
                </Badge>
              )}
            </div>
            <p className="text-primary-foreground/80 mt-1 text-sm font-medium">
              {t("header.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex flex-row items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={openAddModal}
            className="flex-1 md:flex-none bg-white text-primary hover:bg-slate-50 rounded-xl shadow-sm flex items-center justify-center gap-2 px-6 h-11 transition-all font-bold text-sm"
          >
            <Plus size={18} strokeWidth={2.5} /> 
            {t("buttons.newSupplier")}
          </Button>
          <div className="bg-white p-1.5 rounded-xl backdrop-blur-sm">
            <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon"  />
          </div>
        </div>
      </div>

      <div className="space-y-6 w-full overflow-hidden">
        
        {/* ================= FILTERS ================= */}
        <div className="flex flex-col lg:flex-row gap-4 bg-white border border-slate-200 shadow-sm p-4 sm:p-5 rounded-2xl w-full">
          <div className="relative flex-1 w-full">
            <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400`} />
            <Input
              placeholder={t("filters.searchPlaceholder")}
              className={`w-full rounded-xl border-slate-200 shadow-sm h-12 bg-slate-50 focus-visible:ring-primary/20 focus-visible:border-primary text-[14px] ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
          <div className="w-full lg:w-auto">
            <Select onValueChange={(val) => setFilters({ ...filters, status: val === "all" ? "" : val, page: 1 })}>
              <SelectTrigger  className="w-full lg:w-[220px] px-4 rounded-xl border-slate-200 shadow-sm h-12 bg-slate-50 focus:ring-primary/20 text-[14px]">
                <SelectValue placeholder={t("filters.statusFilter")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-primary border-slate-200 shadow-xl">
                <SelectItem value="all" className="rounded-lg py-2 ">{t("filters.allStatuses")}</SelectItem>
                <SelectItem value="ACTIVE" className="rounded-lg py-2   font-medium">{t("filters.active")}</SelectItem>
                <SelectItem value="INACTIVE" className="rounded-lg py-2   font-medium">{t("filters.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ================= MODAL ================= */}
        <SupplierFormModal 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen} 
          supplier={selectedSupplier} 
        />

        {/* ================= DATA RENDER ================= */}
        <div className="w-full">
          {isLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 font-medium shadow-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              {t("table.loading")}
            </div>
          ) : isError ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-rose-500 font-bold shadow-sm">
              {t("table.error")}
            </div>
          ) : suppliersData?.data?.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 font-medium shadow-sm flex flex-col items-center justify-center gap-3">
              <Building2 size={40} className="opacity-20" />
              {t("table.noData")}
            </div>
          ) : (
            <>
   
              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {suppliersData?.data?.map((sup: any) => (
                  <div key={sup.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between  p-4 rounded-t-2xl bg-gray-100 items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-md shrink-0">
                          <User size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-primary text-[15px]">{sup.name}</h3>
                          {sup.company_name && <p className="text-primary text-[12px] mt-0.5">{sup.company_name}</p>}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-400">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px] p-2 rounded-xl border-slate-200 shadow-xl bg-white" >
                          <DropdownMenuItem onClick={() => openEditModal(sup)} className="cursor-pointer rounded-lg text-slate-700 focus:bg-slate-100 font-medium flex items-center gap-2">
                            <Edit2 size={14} /> {t("buttons.edit")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-2 gap-3  bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1"><Phone size={12}/> الهاتف</span>
                        <span className="text-[13px] font-mono text-slate-700" >{sup.phone || "-"}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1"><Wallet size={12}/> {t("table.balance")}</span>
                        <span className={`text-[13px] font-bold ${Number(sup.balance) > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {formatCurrency(sup.balance)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center  p-4 justify-between">
                      {sup.status === 'ACTIVE' ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-lg px-3 py-1 font-medium shadow-none">
                          {t("filters.active")}
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-50 text-rose-700 border-rose-200 rounded-lg px-3 py-1 font-medium shadow-none">
                          {t("filters.inactive")}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 
                ================= 2. DESKTOP VIEW (TABLE) ================= 
                يظهر فقط في شاشات اللابتوب والكمبيوتر
              */}
              <div className="hidden lg:block bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden w-full">
                <div className="overflow-x-auto w-full">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className={`font-semibold text-slate-500 py-4 ${isRTL ? "text-right" : "text-left"}`}>{t("table.name")}</TableHead>
                        <TableHead className="font-semibold text-slate-500 text-center py-4">{t("table.contact")}</TableHead>
                        <TableHead className="font-semibold text-slate-500 text-center py-4">{t("table.balance")}</TableHead>
                        <TableHead className="font-semibold text-slate-500 text-center py-4">{t("table.status")}</TableHead>
                        <TableHead className="font-semibold text-slate-500 text-center w-[80px] py-4">{t("table.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliersData?.data?.map((sup: any) => (
                        <TableRow key={sup.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-bold text-slate-800">{sup.name}</span>
                              {sup.company_name && <span className="text-xs text-slate-500 font-medium">{sup.company_name}</span>}
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-center py-4">
                            <span className="text-[13px] text-slate-700 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-100" dir="ltr">
                              {sup.phone || "-"}
                            </span>
                          </TableCell>
                          
                          <TableCell className="text-center py-4">
                            <span className={`text-[14px] font-bold ${Number(sup.balance) > 0 ? 'text-rose-600 bg-rose-50 px-3 py-1 rounded-lg' : 'text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100'}`}>
                              {formatCurrency(sup.balance)}
                            </span>
                          </TableCell>
                          
                          <TableCell className="text-center py-4">
                            {sup.status === 'ACTIVE' ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-lg px-3 py-1.5 font-medium shadow-none">
                                {t("filters.active")}
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-50 text-rose-700 border-rose-200 rounded-lg px-3 py-1.5 font-medium shadow-none">
                                {t("filters.inactive")}
                              </Badge>
                            )}
                          </TableCell>
                          
                          <TableCell className="py-4">
                            <div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-slate-100 text-slate-400">
                                    <MoreHorizontal className="h-5 w-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[160px] p-2 space-y-1 rounded-xl border-slate-200 shadow-xl bg-white" >
                                  <DropdownMenuLabel className="font-semibold text-[10px] text-slate-400 px-2 py-1.5 uppercase tracking-wider">
                                    {t("table.quickActions")}
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => openEditModal(sup)} className="cursor-pointer rounded-lg text-slate-700 focus:bg-slate-100 font-medium">
                                    <Edit2 size={14} className={isRTL ? "ml-2" : "mr-2"} /> {t("buttons.edit")}
                                  </DropdownMenuItem>
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

          {/* ================= PAGINATION ================= */}
          {suppliersData?.pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 mt-6 border border-slate-200 bg-white rounded-2xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-[13px] text-slate-500 font-medium w-full sm:w-auto text-center sm:text-left">
                <div>
                  صفحة <span className="font-bold text-slate-800">{suppliersData.pagination.currentPage}</span> من <span className="font-bold text-slate-800">{suppliersData.pagination.totalPages}</span>
                </div>
                <div className="hidden sm:block border-l border-slate-200 h-4" />
                <div>
                  الإجمالي: <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">{suppliersData.pagination.totalRecords}</span>
                </div>
              </div>
              <div className="flex gap-2 px-4 flex-row  flex-wrap  w-full sm:w-auto justify-center sm:justify-end">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(suppliersData.pagination.currentPage - 1)} disabled={!suppliersData.pagination.hasPrevPage} className="rounded-xl shadow-sm border-slate-200 text-slate-600 font-bold hover:bg-slate-50 h-10 px-6 w-full sm:w-auto">
                  السابق
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(suppliersData.pagination.currentPage + 1)} disabled={!suppliersData.pagination.hasNextPage} className="rounded-xl shadow-sm border-slate-200 text-slate-600 font-bold hover:bg-slate-50 h-10 px-6 w-full sm:w-auto">
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