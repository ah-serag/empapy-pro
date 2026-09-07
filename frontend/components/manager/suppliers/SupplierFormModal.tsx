"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, User, Building, Phone, Mail, FileText, MapPin } from "lucide-react";

import { supplierSchema, SupplierFormValues } from "@/lib/validation/supplierSchema";
import { useCreateSupplierMutation, useUpdateSupplierMutation } from "@/redux/features/supplierApiSlice";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SupplierFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: any | null; 
}

export default function SupplierFormModal({ open, onOpenChange, supplier }: SupplierFormModalProps) {
  const t = useTranslations("suppliersManager");
  
  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();
  
  const isEditing = !!supplier;
  const isLoading = isCreating || isUpdating;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "", phone: "", email: "", address: "", company_name: "", tax_number: "", status: "ACTIVE"
    }
  });

  useEffect(() => {
    if (open) {
      if (isEditing && supplier) {
        reset({
          name: supplier.name,
          phone: supplier.phone || "",
          email: supplier.email || "",
          address: supplier.address || "",
          company_name: supplier.company_name || "",
          tax_number: supplier.tax_number || "",
          status: supplier.status || "ACTIVE",
        });
      } else {
        reset({
          name: "", phone: "", email: "", address: "", company_name: "", tax_number: "", status: "ACTIVE"
        });
      }
    }
  }, [open, isEditing, supplier, reset]);

  const onSubmit = async (data: SupplierFormValues) => {
    try {
      if (isEditing) {
        await updateSupplier({ id: supplier.id, data }).unwrap();
        toast.success(t("toasts.editSuccess"));
      } else {
        await createSupplier(data).unwrap();
        toast.success(t("toasts.addSuccess"));
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.error || err?.data?.message || t("toasts.error"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[400px] w-[95vw] h-[90vh] sm:h-auto max-h-[90vh] flex flex-col p-0 gap-0 border-0 rounded-2xl bg-white shadow-2xl overflow-hidden"
        dir="rtl"
      >
        <div className="bg-primary px-4 py-3 shrink-0 z-10 text-right">
          <DialogTitle className="font-bold text-[15px] text-white flex items-center justify-start gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
              <User size={15} />
            </div>
            {isEditing ? t("modal.editTitle") : t("modal.addTitle")}
          </DialogTitle>
          <p className="text-[11px] text-primary-foreground/80 mt-1 pr-9 text-right leading-tight">
            {isEditing ? "قم بتحديث بيانات المورد الأساسية أدناه." : "أدخل بيانات المورد الجديد لربطه بالحسابات والمشتريات."}
          </p>
        </div>

        <ScrollArea className="flex-1 min-h-0 w-full bg-slate-50/30">
          <form id="supplier-form" onSubmit={handleSubmit(onSubmit)} className="p-4 flex flex-col gap-3.5">
            
            <div className="flex flex-col gap-1.5">
              <label className="block text-right text-[12px] font-bold text-slate-700">
                {t("modal.name")} <span className="text-red-500 mr-1">*</span>
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input 
                  {...register("name")} 
                  placeholder="مثال: شركة المهندس للتوريدات"
                  className={`rounded-lg bg-white border-slate-200 h-9 px-3 pr-9 text-right text-[12px] focus-visible:ring-primary/20 shadow-sm transition-all w-full ${errors.name ? 'border-red-300 focus-visible:ring-red-200' : ''}`} 
                />
              </div>
              {errors.name && <p className="text-[10px] text-right font-bold text-red-500">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="block text-right text-[12px] font-bold text-slate-700">
                {t("modal.company_name")}
              </label>
              <div className="relative">
                <Building className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input 
                  {...register("company_name")} 
                  placeholder="الاسم التجاري للشركة"
                  className="rounded-lg bg-white border-slate-200 h-9 px-3 pr-9 text-right text-[12px] focus-visible:ring-primary/20 shadow-sm transition-all w-full" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="block text-right text-[12px] font-bold text-slate-700">
                {t("modal.phone")}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input 
                  {...register("phone")} 
                  type="tel"
                  placeholder="010XXXXXXXX"
                  className="rounded-lg bg-white border-slate-200 h-9 px-3 pl-9 text-left text-[12px] font-mono focus-visible:ring-primary/20 shadow-sm transition-all w-full" 
                  dir="ltr" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="block text-right text-[12px] font-bold text-slate-700">
                {t("modal.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input 
                  {...register("email")} 
                  type="email"
                  placeholder="supplier@company.com"
                  className={`rounded-lg bg-white border-slate-200 h-9 px-3 pl-9 text-left text-[12px] focus-visible:ring-primary/20 shadow-sm transition-all w-full ${errors.email ? 'border-red-300 focus-visible:ring-red-200' : ''}`} 
                  dir="ltr" 
                />
              </div>
              {errors.email && <p className="text-[10px] text-right font-bold text-red-500">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="block text-right text-[12px] font-bold text-slate-700">
                {t("modal.tax_number")}
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input 
                  {...register("tax_number")} 
                  placeholder="123-456-789"
                  className="rounded-lg bg-white border-slate-200 h-9 px-3 pl-9 text-left text-[12px] font-mono focus-visible:ring-primary/20 shadow-sm transition-all w-full" 
                  dir="ltr" 
                />
              </div>
            </div>

            {isEditing && supplier && (
              <div className="flex flex-col gap-1.5">
                <label className="block text-right text-[12px] font-bold text-slate-700">
                  {t("modal.status")}
                </label>
                <Select defaultValue={supplier.status} onValueChange={(val) => setValue("status", val as "ACTIVE" | "INACTIVE")}>
                  <SelectTrigger className="rounded-lg px-3 text-right bg-white border-slate-200 h-9 text-[12px] focus:ring-primary/20 shadow-sm w-full">
                    <SelectValue placeholder="اختر حالة المورد" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-slate-200 shadow-xl" dir="rtl">
                    <SelectItem value="ACTIVE" className="text-emerald-600 font-bold my-1 text-right text-[12px] focus:bg-emerald-50 focus:text-emerald-700">{t("filters.active")}</SelectItem>
                    <SelectItem value="INACTIVE" className="text-rose-600 font-bold my-1 text-right text-[12px] focus:bg-rose-50 focus:text-rose-700">{t("filters.inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="block text-right text-[12px] font-bold text-slate-700">
                {t("modal.address")}
              </label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input 
                  {...register("address")} 
                  placeholder="مثال: القاهرة، شارع التسعين، التجمع الخامس"
                  className="rounded-lg bg-white border-slate-200 h-9 px-3 pr-9 text-right text-[12px] focus-visible:ring-primary/20 shadow-sm transition-all w-full" 
                />
              </div>
            </div>

          </form>
        </ScrollArea>

        <div className="bg-white border-t border-slate-100 px-4 py-3 flex flex-col sm:flex-row justify-end gap-2.5 shrink-0 z-10">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="rounded-lg h-9 px-5 w-full sm:w-auto border-slate-200 text-slate-600 font-bold hover:bg-slate-50 shadow-sm order-2 sm:order-1 text-[12px]"
          >
            {t("buttons.cancel")}
          </Button>
          
          <Button 
            type="submit" 
            form="supplier-form"
            disabled={isLoading} 
            className="rounded-lg h-9 px-6 bg-primary text-white hover:bg-primary/95 font-bold w-full sm:w-auto shadow-md order-1 sm:order-2 transition-all active:scale-[0.98] text-[12px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin ml-2" />
                {t("buttons.saving")}
              </>
            ) : (
              t("buttons.save")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}