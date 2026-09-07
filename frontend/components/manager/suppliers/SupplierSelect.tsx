"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { useGetSuppliersForSelectQuery } from "@/redux/features/supplierApiSlice";

interface SupplierSelectProps {
  value?: number;
  onChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
}

export default function SupplierSelect({ value, onChange, error, disabled }: SupplierSelectProps) {
  // جلب البيانات من الـ RTK Query
  const { data: response, isLoading, isError } = useGetSuppliersForSelectQuery(undefined);
  const suppliers = response?.data || [];

  return (
    <div className="space-y-1.5 w-full">
      <Select 
        disabled={isLoading || disabled || isError} 
        value={value ? value.toString() : undefined} 
        onValueChange={(val) => onChange(Number(val))}
      >
        <SelectTrigger 
        dir="rtl"
          className={`w-full rounded-xl px-4 py-7 h-12 bg-slate-50 border-slate-200 shadow-sm focus:ring-2 focus:ring-primary/20 ${error ? 'border-red-400 ring-red-100' : ''}`}
        >
          {isLoading ? (
            <div className="flex items-center text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2 ml-2" />
              جاري تحميل الموردين...
            </div>
          ) : isError ? (
            <div className="flex items-center text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 mr-2 ml-2" />
              خطأ في التحميل
            </div>
          ) : (
            <SelectValue placeholder="اختر المورد من القائمة..." />
          )}
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[300px]">
          {suppliers.map((supplier: any) => (
            <SelectItem 
              key={supplier.id} 
              value={supplier.id.toString()}
              className="py-3 px-4 cursor-pointer focus:bg-slate-50 border-b border-slate-50 last:border-0"
            >
              <div className="flex flex-col gap-1 text-right">
                <span className="font-bold text-slate-800 text-[14px]">
                  {supplier.name}
                </span>
                {supplier.company_name && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    الشركة: {supplier.company_name}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
          {suppliers.length === 0 && !isLoading && (
            <div className="p-4 text-center text-sm text-slate-500">لا يوجد موردين متاحين</div>
          )}
        </SelectContent>
      </Select>
      {error && <span className="text-[11px] font-semibold text-red-500">{error}</span>}
    </div>
  );
}