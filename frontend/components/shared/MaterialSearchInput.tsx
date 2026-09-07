"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Package } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce"; 
import { useLazySearchMaterialsForExecutionQuery } from "@/redux/features/TeamApiSlice"; 
interface MaterialSearchInputProps {
  onSelect: (material: any) => void;
  error?: string;
}

export default function MaterialSearchInput({ onSelect, error }: MaterialSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // استخدام الـ Debounce لانتظار نصف ثانية بعد توقف المستخدم عن الكتابة
  const debouncedSearchTerm = useDebounce(searchTerm, 500); 
  const [triggerSearch, { data, isFetching }] = useLazySearchMaterialsForExecutionQuery();

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // تنفيذ البحث بناءً على الكلمة بعد الـ Debounce
  useEffect(() => {
    // البحث يبدأ فقط لو الكلمة أكبر من حرفين (يعني 3 حروف أو أكتر)
    if (debouncedSearchTerm.trim().length > 2) {
      triggerSearch(debouncedSearchTerm);
      setIsOpen(true);
    } else {
      setIsOpen(false); // إغلاق القائمة إذا كانت الحروف أقل من 3
    }
  }, [debouncedSearchTerm, triggerSearch]);

  const materials = data?.data || [];

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="ابحث باسم الصنف أو السريال (3 حروف على الأقل)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`h-12 rounded-xl pr-10 bg-slate-50 border-slate-200 focus-visible:ring-primary/20 transition-all ${error ? 'border-red-400 ring-red-100 focus-visible:ring-red-200' : ''}`}
        />
        {isFetching && (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
        )}
      </div>
      
      {/* رسالة الخطأ إن وجدت */}
      {error && <span className="text-xs font-semibold text-red-500 mt-1 block">{error}</span>}

      {/* القائمة المنسدلة للنتائج */}
      {isOpen && searchTerm.trim().length > 2 && !isFetching && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl max-h-64 overflow-y-auto">
          {materials.length > 0 ? (
            materials.map((mat: any) => (
              <div
                key={mat.id}
                onClick={() => {
                  onSelect(mat);
                  setSearchTerm(""); // تفريغ حقل البحث بعد اختيار الصنف
                  setIsOpen(false);  // إغلاق القائمة
                }}
                className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">{mat.name}</span>
                  <span className="text-xs text-slate-500 font-mono">{mat.sku}</span>
                </div>
                <div className="flex gap-2">
                  {mat.is_serialized && (
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-bold">
                      بسيريال
                    </span>
                  )}
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded-md font-medium text-slate-700">
                    رصيد: {mat.available_stock} {mat.unit}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-5 text-center text-slate-500 text-sm flex flex-col items-center gap-2 bg-slate-50/50">
              <Package className="w-8 h-8 text-slate-300" />
              لا توجد خامات مطابقة للبحث
            </div>
          )}
        </div>
      )}
    </div>
  );
}