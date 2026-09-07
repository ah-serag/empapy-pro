"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useGetAccountsListQuery } from "@/redux/features/treasurySafesApiSlice"; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AccountSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

export default function AccountSelect({ 
  value, 
  onChange, 
  placeholder = "اختر الحساب...", 
  error = false,
  disabled = false 
}: AccountSelectProps) {
  
  const { data: response, isLoading, isError } = useGetAccountsListQuery(undefined);
  
  const accounts = response?.data || [];

  return (
    <Select 
      value={value} 
      onValueChange={onChange} 
      disabled={isLoading || isError || disabled}
    >
      <SelectTrigger 
      dir="rtl"
        className={cn(
          "w-full h-11 bg-white rounded-xl border-slate-200 px-4 shadow-sm transition-all text-sm font-medium",
          error ? "border-red-500 focus:ring-2 focus:ring-red-500/20" : "focus:border-primary focus:ring-2 focus:ring-primary/20",
          (isLoading || disabled) && "bg-slate-50 cursor-not-allowed opacity-80"
        )}
      >
        <SelectValue 
          placeholder={
            isLoading ? "جاري تحميل الحسابات..." : 
            isError ? "فشل تحميل الحسابات" : 
            placeholder
          } 
        />
      </SelectTrigger>
      
      <SelectContent className="rounded-xl border-slate-200  shadow-xl max-h-60 w-fit" dir="rtl">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-4 text-center text-sm font-medium text-slate-500">
            لا توجد حسابات متاحة
          </div>
        ) : (
          accounts.map((acc: { id: number; name: string; code: string }) => (
            <SelectItem 
              key={acc.id} 
              value={String(acc.id)} 
              dir="rtl"
              className="rounded-lg font-normal cursor-pointer focus:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-800">{acc.name}</span>

              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}