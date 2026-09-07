import React from "react";
import { Wallet, Loader2, ChevronDown, AlertCircle } from "lucide-react";
import { useGetCompanySafesQuery } from "@/redux/features/treasurySafesApiSlice";
import { cn } from "@/lib/utils";

interface CompanySafeSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CompanySafeSelect({ 
  value, 
  onChange, 
  placeholder = "اختر محفظة أو خزنة الشركة...", 
  disabled = false,
  className 
}: CompanySafeSelectProps) {
  const { data, isLoading, isError } = useGetCompanySafesQuery(undefined, {
    refetchOnMountOrArgChange: true, 
  });
  
  const safes = data?.data || [];

  return (
    <div className={cn("relative w-full group", className)}>
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-colors pointer-events-none z-10">
        <Wallet size={18} />
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading || isError}
        className={cn(
          "w-full h-11 pr-11 pl-10 bg-white border border-slate-200 rounded-xl text-sm font-bold transition-all appearance-none outline-none",
          "focus:border-secondary focus:ring-4 focus:ring-secondary/10",
          "hover:border-slate-300",
          "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
          !value ? "text-slate-400 font-medium" : "text-slate-800"
        )}
      >
        <option value="" disabled hidden>{placeholder}</option>
        
        {safes.map((safe: { id: number; name: string }) => (
          <option key={safe.id} value={safe.id} className="text-slate-700 font-bold">
            {safe.name}
          </option>
        ))}
      </select>

      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-slate-400" />
        ) : isError ? (
          <AlertCircle size={16} className="text-rose-400" />
        ) : (
          <ChevronDown size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
        )}
      </div>

      {isError && (
        <p className="text-[10px] text-rose-900 font-medium mt-1.5 flex items-center gap-1">
          <AlertCircle size={10} /> حدث خطأ في تحميل الخزائن
        </p>
      )}
    </div>
  );
}