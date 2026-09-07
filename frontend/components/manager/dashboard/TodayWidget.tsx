'use client';

import { useGetTodayDashQuery } from "@/redux/features/dashMangerSlice";
import { useTranslations } from 'next-intl';
import { 
  CalendarClock, 
  CalendarPlus, 
  ClipboardPlus, 
  Receipt 
} from "lucide-react";
import { useSearchParams } from "next/navigation";

const TODAY_KEYS = [
  'today_new_bookings',
  'today_assignments',
  'today_invoices'
];

const ITEM_UI = {
  today_new_bookings: { 
    icon: CalendarPlus, 
    containerClass: 'bg-sky-50/30 border border-sky-100 hover:bg-sky-50', 
    textClass: 'text-sky-800 font-bold',
    badgeClass: 'bg-white text-sky-700 border-sky-200'
  },
  today_assignments: { 
    icon: ClipboardPlus, 
    containerClass: 'bg-amber-50/30 border border-amber-100 hover:bg-amber-50', 
    textClass: 'text-amber-800 font-bold',
    badgeClass: 'bg-white text-amber-700 border-amber-200'
  },
  today_invoices: { 
    icon: Receipt, 
    containerClass: 'bg-emerald-50/30 border border-emerald-100 hover:bg-emerald-50', 
    textClass: 'text-emerald-800 font-bold',
    badgeClass: 'bg-white text-emerald-700 border-emerald-200'
  }
};

export default function TodayWidget() {
  const t = useTranslations("dashboard.today");

  const params = useSearchParams();
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
    
  const queryParams = startDate && endDate ? { startDate, endDate } : undefined;
    
  const { data, isLoading, isError } = useGetTodayDashQuery(queryParams);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] animate-pulse h-full min-h-[380px]">
        <div className="h-6 bg-slate-100 rounded w-1/3 mb-6"></div>
        <div className="flex flex-col gap-3.5 mt-8">
           {[...Array(3)].map((_, i) => (
             <div key={i} className="h-12 rounded-xl bg-slate-50 w-full border border-slate-100"></div>
           ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] h-[380px] flex items-center justify-center">
        <p className="text-slate-500 text-[13px] font-bold">حدث خطأ أثناء تحميل بيانات اليوم</p>
      </div>
    );
  }

  const stats = data?.data || {};
  
  const newBookings = stats.today_new_bookings || 0;
  const newAssignments = stats.today_assignments || 0;
  const newInvoices = stats.today_invoices || 0;

  const totalActivities = newBookings + newAssignments + newInvoices;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] h-full flex flex-col">
      
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <CalendarClock className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 tracking-tight leading-tight">
              {t('title')}
            </h2>
            <p className="text-[12px] text-slate-500 font-medium mt-0.5">
              ملخص نشاط النظام اليومي
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-lg px-4 py-1.5 min-w-[60px]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total</span>
          <span className="text-lg font-mono font-bold text-slate-800 leading-none">{totalActivities}</span>
        </div>
      </div>

      <div className="flex flex-col p-5 gap-3.5 flex-grow justify-center">
        {TODAY_KEYS.map((key) => {
          const UI = ITEM_UI[key as keyof typeof ITEM_UI];
          const Icon = UI.icon;
          const count = stats[key as keyof typeof stats] || 0;

          return (
            <div 
              key={key} 
              className={`flex justify-between items-center p-3.5 rounded-xl transition-all duration-200 border ${UI.containerClass}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${UI.textClass}`} strokeWidth={2} />
                <span className={`text-[13px] ${UI.textClass}`}>
                  {t(`items.${key}`)}
                </span>
              </div>
              
              <span className={`text-[13px] font-mono font-bold px-3 py-1 rounded-md shadow-sm border ${UI.badgeClass}`}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}