'use client';

import { useGetTeamDashQuery } from "@/redux/features/dashMangerSlice";
import { useTranslations } from 'next-intl';
import { 
  Users, 
  UserCheck, 
  HardHat 
} from "lucide-react";

export default function TeamsWidget() {
  const t = useTranslations("dashboard.teams");
  const { data, isLoading, isError } = useGetTeamDashQuery(undefined);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] animate-pulse h-full min-h-[380px]">
        <div className="h-6 bg-slate-100 rounded w-1/3 mb-6"></div>
        <div className="flex flex-col gap-3.5 mt-8">
           {[...Array(2)].map((_, i) => (
             <div key={i} className="h-12 rounded-xl bg-slate-50 w-full border border-slate-100"></div>
           ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] h-[380px] flex items-center justify-center">
        <p className="text-slate-500 text-[13px] font-bold">حدث خطأ أثناء تحميل بيانات الفرق</p>
      </div>
    );
  }

  const stats = data?.data || {};
  const totalTeams = stats.total_teams || 0;
  const availableTeams = stats.available_teams || 0;
  const totalMembers = stats.total_members || 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] h-full flex flex-col">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Users className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 tracking-tight leading-tight">
              {t('title')}
            </h2>
            <p className="text-[12px] text-slate-500 font-medium mt-0.5">
              إحصائيات الفرق الفنية
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-lg px-4 py-1.5 min-w-[60px]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total</span>
          <span className="text-lg font-mono font-bold text-slate-800 leading-none">{totalTeams}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col p-5 gap-3.5 flex-grow justify-center">
        
        {/* Available Teams */}
        <div className="flex justify-between items-center p-3.5 rounded-xl transition-all duration-200 border bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-emerald-800" strokeWidth={2} />
            <span className="text-[13px] text-emerald-800 font-bold">
              {t('available_teams')}
            </span>
          </div>
          <span className="text-[13px] font-mono font-bold px-3 py-1 rounded-md shadow-sm border bg-white text-emerald-700 border-emerald-200">
            {availableTeams}
          </span>
        </div>

        {/* Total Members */}
        <div className="flex justify-between items-center p-3.5 rounded-xl transition-all duration-200 border bg-slate-50 border-slate-200 hover:bg-slate-100/50">
          <div className="flex items-center gap-3">
            <HardHat className="w-5 h-5 text-slate-700" strokeWidth={2} />
            <span className="text-[13px] text-slate-700 font-bold">
              {t('total_members')}
            </span>
          </div>
          <span className="text-[13px] font-mono font-bold px-3 py-1 rounded-md shadow-sm border bg-white text-slate-600 border-slate-200">
            {totalMembers}
          </span>
        </div>

      </div>

    </div>
  );
}