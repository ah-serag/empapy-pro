'use client';

import { useTranslations } from 'next-intl';
import BookingWidget from '@/components/manager/dashboard/BookingWidget';
import FinancialWidget from '@/components/manager/dashboard/FinancialWidget';
import InvoicesWidget from '@/components/manager/dashboard/InvoicesWidget';
import AssignmentsWidget from '@/components/manager/dashboard/AssignmentsWidget';
import TeamsWidget from '@/components/manager/dashboard/TeamsWidget';
import UsersWidget from '@/components/manager/dashboard/UsersWidget';
import TodayWidget from '@/components/manager/dashboard/TodayWidget';
import DateFilter from '@/components/shared/DateFilter';
import { LayoutDashboard } from 'lucide-react';
import CollectionsWidget from '@/components/manager/dashboard/CollectionsWidget';
import ExpensesWidget from '@/components/manager/dashboard/ExpensesWidget';

export default function DashboardPage() {
  const  t  = useTranslations("dashboard");

  return (
    <div className="min-h-screen p-4 bg-slate-50 ">

<div className="bg-white rounded-2xl border border-slate-200 p-3 md:p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-white    flex items-center justify-center text-primary shrink-0 shadow-sm">
      <LayoutDashboard className="w-5 h-5" strokeWidth={2} />
    </div>
    <div>
      <h1 className="text-xl md:text-2xl font-normal text-primary tracking-tight leading-tight">
        {t('title')}
      </h1>
      <p className="text-[13px] text-slate-500 font-medium mt-1">
        نظرة عامة على أداء النظام وإحصائيات العمل
      </p>
    </div>
  </div>
</div>




      <div> 
        <DateFilter/>

      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <InvoicesWidget/>
         <CollectionsWidget/>
         <ExpensesWidget/>
        <TeamsWidget/>

        <TodayWidget/>

        <AssignmentsWidget/> 

        <BookingWidget />
                <UsersWidget/>

      </div>
    </div>
  );
}