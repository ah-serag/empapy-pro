'use client';

import { useGetUsersDashQuery } from "@/redux/features/dashMangerSlice";
import { useTranslations } from 'next-intl';
import { 
  UserCog, 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  Wrench, 
  User 
} from "lucide-react";

const ALL_USER_ROLES = [
  'superadmin',
  'admin',
  'supervisor',
  'technician',
  'client'
];

const ROLE_UI = {
  superadmin: { 
    icon: ShieldAlert,
    containerClass: 'bg-violet-50/30 border border-violet-100 hover:bg-violet-50',
    textClass: 'text-violet-800 font-bold',
    badgeClass: 'bg-white text-violet-700 border-violet-200'
  },
  admin: { 
    icon: ShieldCheck,
    containerClass: 'bg-indigo-50/30 border border-indigo-100 hover:bg-indigo-50',
    textClass: 'text-indigo-800 font-bold',
    badgeClass: 'bg-white text-indigo-700 border-indigo-200'
  },
  supervisor: { 
    icon: UserCheck,
    containerClass: 'bg-sky-50/30 border border-sky-100 hover:bg-sky-50',
    textClass: 'text-sky-800 font-bold',
    badgeClass: 'bg-white text-sky-700 border-sky-200'
  },
  technician: { 
    icon: Wrench,
    containerClass: 'bg-amber-50/30 border border-amber-100 hover:bg-amber-50',
    textClass: 'text-amber-800 font-bold',
    badgeClass: 'bg-white text-amber-700 border-amber-200'
  },
  client: { 
    icon: User,
    containerClass: 'bg-slate-50 border border-slate-200 hover:bg-slate-100/50',
    textClass: 'text-slate-700 font-bold',
    badgeClass: 'bg-white text-slate-600 border-slate-200'
  }
};

export default function UsersWidget() {
  const t = useTranslations("dashboard.users");
  const { data, isLoading, isError } = useGetUsersDashQuery(undefined);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] animate-pulse h-full min-h-[420px]">
        <div className="h-6 bg-slate-100 rounded w-1/3 mb-6"></div>
        <div className="flex flex-col gap-3 mt-8">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="h-12 rounded-xl bg-slate-50 w-full border border-slate-100"></div>
           ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] h-[420px] flex items-center justify-center">
        <p className="text-slate-500 text-[13px] font-bold">حدث خطأ أثناء تحميل بيانات المستخدمين</p>
      </div>
    );
  }

  const stats = data?.data?.roles || {};
  const total = data?.data?.total || 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] h-full flex flex-col">
      
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <UserCog className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 tracking-tight leading-tight">
              {t('title')}
            </h2>
            <p className="text-[12px] text-slate-500 font-medium mt-0.5">
              توزيع صلاحيات المستخدمين
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-lg px-4 py-1.5 min-w-[60px]">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total</span>
          <span className="text-lg font-mono font-bold text-slate-800 leading-none">{total}</span>
        </div>
      </div>

      <div className="flex flex-col p-5 gap-3 flex-grow justify-center">
        {ALL_USER_ROLES.map((role) => {
          const UI = ROLE_UI[role as keyof typeof ROLE_UI];
          const Icon = UI.icon;
          const count = stats[role] || 0;

          return (
            <div 
              key={role} 
              className={`flex justify-between items-center p-3.5 rounded-xl transition-all duration-200 border ${UI.containerClass}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${UI.textClass}`} strokeWidth={2} />
                <span className={`text-[13px] ${UI.textClass}`}>
                  {t(`roles.${role}`)}
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