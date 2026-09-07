'use client';

import { useGetFinancialAmountDashQuery } from "@/redux/features/dashMangerSlice";
import { useSearchParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { 
  Banknote, 
  TrendingUp, 
  AlertCircle 
} from "lucide-react";

export default function FinancialWidget() {
  const t = useTranslations("dashboard.financial");
   
  const params = useSearchParams();
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");

  const queryParams = startDate && endDate ? { startDate, endDate } : undefined;

  const { data, isLoading, isError } = useGetFinancialAmountDashQuery(queryParams);

  const formatMoney = (amount: string | number) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return '0';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm animate-pulse h-[380px]">
        <div className="h-6 bg-slate-100 rounded-lg w-1/3 mb-6"></div>
        <div className="h-12 bg-slate-100 rounded-lg w-1/2 mb-10"></div>
        <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="h-16 bg-slate-50 rounded-lg w-full"></div>
          <div className="h-16 bg-slate-50 rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-8 shadow-sm h-[380px] flex items-center justify-center">
        <p className="text-red-500 text-sm font-medium">حدث خطأ أثناء تحميل البيانات المالية</p>
      </div>
    );
  }

  const stats = data?.data || {};
  const totalRevenue = stats.total_revenue || "0";
  const collectedRevenue = stats.collected_revenue || "0";
  const pendingRevenue = stats.pending_revenue || "0";

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm transition-shadow hover:shadow-md h-full flex flex-col justify-between">
      
      <div className="p-8 pb-10 border-b border-slate-100 bg-gray-100 flex-grow">
        <h2 className="text-lg font-medium text-primary gap-3 items-center flex mb-6">
          <span className="p-2 bg-primary/5 rounded-lg text-primary shadow-sm">
            <Banknote className="w-5 h-5" strokeWidth={1.5} />
          </span>
          {t('title')}
        </h2>
        
        <div className="flex flex-col gap-1 mt-4">
          <span className="text-sm font-medium text-primary/80 uppercase tracking-wider">
            {t('total_revenue')}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl xl:text-5xl md:pt-10 font-light text-primary tracking-tight">
              {formatMoney(totalRevenue)}
            </span>
            <span className="text-base sm:text-lg font-medium text-primary">
              {t('currency')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        
        <div className="p-8 border-b md:border-b-0 border-slate-100 border-l-4 md:border-l-[1px] !border-l-emerald-500 bg-emerald-50/30 transition-colors hover:bg-emerald-50/50 group">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600" strokeWidth={2} />
            <span className="text-sm font-semibold text-emerald-700">
              {t('collected_revenue')}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-xl xl:text-2xl font-medium text-emerald-800 tracking-tight">
              {formatMoney(collectedRevenue)}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              {t('currency')}
            </span>
          </div>
        </div>

        <div className="p-8 border-l-4 !border-l-gray-300 bg-amber-50/30 transition-colors hover:bg-amber-50/50 group">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-600" strokeWidth={2} />
            <span className="text-sm font-semibold text-amber-700">
              {t('pending_revenue')}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-xl xl:text-2xl font-medium text-amber-800 tracking-tight">
              {formatMoney(pendingRevenue)}
            </span>
            <span className="text-xs text-amber-600 font-medium">
              {t('currency')}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}