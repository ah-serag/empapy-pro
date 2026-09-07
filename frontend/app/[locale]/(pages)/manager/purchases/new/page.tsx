"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Trash2, Receipt, Save, Barcode } from "lucide-react";

import { purchaseInvoiceSchema, PurchaseInvoiceFormValues } from "@/lib/validation/purchaseInvoiceSchema";
import { useCreatePurchaseInvoiceMutation } from "@/redux/features/purchaseApiSlice";

import SupplierSelect from "@/components/manager/suppliers/SupplierSelect";
import MaterialSearchInput from "@/components/shared/MaterialSearchInput";
import CompanySafeSelect from "@/components/treasury/CompanySafeSelect"; 
import AccountSelect from "@/components/treasury/AccountSelect"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CreatePurchaseInvoicePage() {
  const router = useRouter();
  const [createInvoice, { isLoading }] = useCreatePurchaseInvoiceMutation();

  const { register, control, handleSubmit, setValue, formState: { errors } ,reset } = useForm({
    resolver: zodResolver(purchaseInvoiceSchema),
    defaultValues: {
      supplier_id: 0, 
      invoice_date: new Date().toISOString().split('T')[0],
      supplier_invoice_number: "",
      items: [], 
      discount: 0,
      paid_amount: 0,
      safe_id: "",
      account_id: "",
      notes: ""
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchItems = useWatch({ control, name: "items" }) || [];
  const watchDiscount = useWatch({ control, name: "discount" }) || 0;
  const watchPaid = useWatch({ control, name: "paid_amount" }) || 0;
  
  const watchSafeId = useWatch({ control, name: "safe_id" });
  const watchAccountId = useWatch({ control, name: "account_id" });

  const totalAmount = watchItems.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0);
  const netAmount = Math.max(0, totalAmount - Number(watchDiscount));
  const remainingAmount = Math.max(0, netAmount - Number(watchPaid));

  const handleMaterialSelect = (material: any) => {
    if (fields.some(f => f.material_id === material.id)) {
      toast.error("هذا الصنف مضاف بالفعل للفاتورة، يمكنك تعديل كميته.");
      return;
    }
    
    const isSerialized = material.is_serialized === true || material.is_serialized === 1;

    append({
      material_id: material.id,
      name: material.name,
      is_serialized: isSerialized,
      quantity: 1,
      unit_price: material.current_price || 0,
      serials: isSerialized ? [{ serial_number: "" }] : undefined
    });
  };

  const handleQuantityChange = (index: number, val: string, isSerialized: boolean) => {
    const newQty = Number(val); 
    setValue(`items.${index}.quantity`, newQty, { shouldValidate: true });
    
    if (isSerialized) {
      const currentSerials = watchItems[index]?.serials || [];
      if (newQty > currentSerials.length) {
        const diff = newQty - currentSerials.length;
        const newFields = Array(diff).fill({ serial_number: "" });
        setValue(`items.${index}.serials`, [...currentSerials, ...newFields]);
      } else if (newQty < currentSerials.length) {
        setValue(`items.${index}.serials`, currentSerials.slice(0, newQty));
      }
    }
  };

  const onSubmit = async (data: PurchaseInvoiceFormValues) => {
    try {
      if (data.supplier_id <= 0) {
        return toast.error("برجاء اختيار المورد أولاً.");
      }
      
      if (data.items.length === 0) {
        return toast.error("يجب إضافة صنف واحد على الأقل للفاتورة.");
      }

      if (netAmount < 0) {
        return toast.error("الخصم لا يمكن أن يكون أكبر من إجمالي الفاتورة.");
      }
      
      if (Number(data.paid_amount) > netAmount) {
        return toast.error("المبلغ المدفوع أكبر من الصافي المطلوب.");
      }
      
      if (Number(data.paid_amount) > 0) {
        if (!data.safe_id) return toast.error("يجب اختيار خزنة الصرف لتسجيل الدفعة المالية.");
        if (!data.account_id) return toast.error("يجب اختيار البند المحاسبي لتسجيل الدفعة المالية.");
      }

      await createInvoice(data).unwrap();
      toast.success("تم إنشاء فاتورة المشتريات وتحديث المخازن بنجاح");
       reset()
    } catch (err: any) {
      toast.error(err?.data?.error || err?.data?.message || "حدث خطأ أثناء حفظ الفاتورة");
    }
  };

  return (
    <div className="p-4 sm:p-6 mx-auto space-y-6 bg-slate-50/50 min-h-screen" dir="rtl">
      
      <div className="flex items-center gap-4 bg-primary p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="w-12 h-12 rounded-xl bg-white text-primary flex items-center justify-center shrink-0">
          <Receipt size={24} strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">إنشاء فاتورة مشتريات</h1>
          <p className="text-sm text-slate-200 mt-1">تأكد من مطابقة الأسعار والسيريالات قبل الاعتماد.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          <h2 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
            البيانات الأساسية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">المورد <span className="text-red-500">*</span></label>
              <SupplierSelect 
                onChange={(val: any) => setValue("supplier_id", Number(val), { shouldValidate: true })}
                error={errors.supplier_id?.message}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">تاريخ الفاتورة <span className="text-red-500">*</span></label>
              <Input 
                type="date" 
                {...register("invoice_date")} 
                className="rounded-xl h-12 px-4 bg-slate-50 font-medium border-slate-200 focus-visible:ring-primary/20 shadow-none text-sm" 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">رقم الفاتورة الورقية (اختياري)</label>
              <Input 
                {...register("supplier_invoice_number")} 
                placeholder="مثال: INV-0000" 
                className="rounded-xl h-12 px-4 bg-slate-50 font-mono text-sm border-slate-200 focus-visible:ring-primary/20 shadow-none text-left" 
                dir="ltr"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-primary flex items-center gap-2">
              أصناف الفاتورة <span className="text-red-500">*</span>
            </h2>
            <MaterialSearchInput onSelect={handleMaterialSelect} />
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => {
              const currentItem = watchItems[index];
              const isSerialized = currentItem?.is_serialized;
              
              return (
                <div key={field.id} className="flex flex-col gap-4 bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl relative">
                  
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => remove(index)} 
                    className="absolute top-2 left-2 sm:hidden h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </Button>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end pt-4 sm:pt-0">
                    
                    <div className="sm:col-span-4 flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-500">اسم الصنف</label>
                      <div className="h-11 px-3 bg-white border border-slate-200 rounded-xl flex items-center shadow-none text-sm font-bold text-slate-800">
                        <span className="truncate flex-1">{currentItem?.name}</span>
                        {isSerialized && <Barcode size={16} className="text-slate-400 shrink-0" />}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:col-span-4 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-500">الكمية</label>
                        <Input 
                          type="number" 
                          min="1"
                          value={currentItem?.quantity || ""}
                          onChange={(e) => handleQuantityChange(index, e.target.value, !!isSerialized)}
                          className="rounded-xl h-11 px-3 bg-white text-sm font-mono shadow-none border-slate-200 focus-visible:ring-primary/20 text-center" 
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-500">سعر الوحدة</label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...register(`items.${index}.unit_price` as const)} 
                          className="rounded-xl h-11 px-3 bg-white text-sm font-mono shadow-none border-slate-200 focus-visible:ring-primary/20 text-center" 
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3 flex items-center justify-center">
                      <div className="flex flex-col gap-2 w-full">
                        <label className="text-xs font-semibold text-slate-500 sm:hidden">الإجمالي</label>
                        <span className="font-mono font-bold text-primary bg-primary/5 px-4 h-11 flex items-center justify-center rounded-xl w-full border border-primary/10 text-sm">
                          {(Number(currentItem?.quantity || 0) * Number(currentItem?.unit_price || 0)).toLocaleString()} ج.م
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:flex sm:col-span-1 justify-end">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => remove(index)} 
                        className="rounded-xl h-11 w-11 hover:bg-red-50 hover:text-red-600 text-slate-400"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>

                  {isSerialized && (
                    <div className="mt-3 bg-white p-4 rounded-xl border border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
                        <Barcode size={14} className="text-slate-400" /> 
                        سيريالات القطع ({currentItem?.quantity || 0}):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {currentItem?.serials?.map((_ :any, sIndex :any) => (
                          <div key={sIndex} className="flex flex-col gap-1.5">
                            <Input 
                              placeholder={`سيريال رقم ${sIndex + 1}`}
                              {...register(`items.${index}.serials.${sIndex}.serial_number` as const)}
                              className="h-10 px-3 text-xs font-mono bg-slate-50 border-slate-200 focus-visible:ring-primary/20 shadow-none rounded-lg text-left"
                              dir="ltr"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <h2 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              تفاصيل الدفع
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-sm font-semibold text-slate-700">المبلغ المدفوع للمورد نقداً (إن وجد)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  {...register("paid_amount")} 
                  className="rounded-xl h-12 px-4 bg-emerald-50/30 border-emerald-200 font-mono text-sm text-emerald-700 font-bold focus-visible:ring-emerald-400 shadow-none text-left" 
                  dir="ltr"
                />
              </div>

              {Number(watchPaid) > 0 && (
                <>
                  <div className="flex flex-col gap-2 animate-in fade-in zoom-in duration-200">
                    <label className="text-sm font-semibold text-slate-700">خزنة الصرف <span className="text-red-500">*</span></label>
                    <CompanySafeSelect 
                      value={String(watchSafeId || "")}
                      onChange={(val) => setValue("safe_id", val, { shouldValidate: true })}
                    />
                  </div>

                  <div className="flex flex-col gap-2 animate-in fade-in zoom-in duration-200">
                    <label className="text-sm font-semibold text-slate-700">البند المحاسبي <span className="text-red-500">*</span></label>
                    <AccountSelect 
                      value={String(watchAccountId || "")}
                      onChange={(val) => setValue("account_id", val, { shouldValidate: true })}
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2 sm:col-span-2 mt-2">
                <label className="text-sm font-semibold text-slate-700">ملاحظات الفاتورة</label>
                <Textarea 
                  {...register("notes")} 
                  className="rounded-xl bg-slate-50 border-slate-200 min-h-[100px] p-4 text-sm focus-visible:ring-primary/20 shadow-none resize-none" 
                  placeholder="اكتب أي تفاصيل إضافية هنا..."
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-primary text-white p-6 rounded-3xl shadow-xl lg:sticky lg:top-6">
            <h2 className="text-base font-bold mb-6 text-slate-200 border-b border-slate-700 pb-4">ملخص الحساب</h2>
            
            <div className="space-y-5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-sm font-medium">إجمالي البضاعة:</span>
                <span className="font-mono text-base font-bold">{totalAmount.toLocaleString()} ج.م</span>
              </div>
              
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-sm font-medium mt-2">الخصم المكتسب:</span>
                <div className="w-32 relative">
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...register("discount")} 
                    className="h-11 pr-8 pl-3 text-left text-sm font-mono font-bold bg-slate-900 border-slate-700 text-white rounded-xl focus-visible:ring-slate-500 shadow-inner" 
                    dir="ltr"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">ج</span>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-5 space-y-4">
                <div className="flex justify-between items-center font-bold text-emerald-400 bg-emerald-400/10 p-3 rounded-xl border border-emerald-400/20">
                  <span className="text-sm">الصافي المطلوب:</span>
                  <span className="font-mono text-lg">{netAmount.toLocaleString()} ج</span>
                </div>
                
                {remainingAmount > 0 && (
                  <div className="flex justify-between items-center text-rose-400 font-bold bg-rose-400/10 p-3 rounded-xl border border-rose-400/20">
                    <span className="text-sm">الباقي الآجل للمورد:</span>
                    <span className="font-mono text-base">{remainingAmount.toLocaleString()} ج</span>
                  </div>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || fields.length === 0} 
              className="w-full mt-8 bg-white hover:bg-gray-200 text-primary h-12 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-[0.98] disabled:active:scale-100 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              اعتماد وتسجيل الفاتورة
            </Button>
          </div>

        </div>
      </form>
    </div>
  );
}