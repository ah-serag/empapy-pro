"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCcw, Wrench, AlertTriangle, User, MapPin } from "lucide-react";
import { useGetRejectedExecutionsQuery } from "@/redux/features/TeamApiSlice";
import EditRejectedExecutionModal from "@/components/Team/EditRejectedExecutionModal";

export default function RejectedExecutionsPage() {
  const t = useTranslations("jobExecutions");
  const [selectedExecution, setSelectedExecution] = useState(null);

  const { data: response, isLoading, isError, refetch } = useGetRejectedExecutionsQuery({ page: 1, limit: 20 });
  const executions = response?.data || [];

  return (
    <div className="pt-0 bg-slate-50 min-h-screen space-y-6" dir="rtl">
      {/* هيدر الصفحة */}
      <div className="flex justify-between items-center bg-white p-2 shadow-sm border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 text-primary rounded-full flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-primary">المهام المرفوضة والمطلوب تعديلها</h1>
            <p className="text-[10px] font-medium text-slate-500">قم بمراجعة ملاحظات الإدارة بالداخل ثم أعد الإرسال.</p>
          </div>
        </div>
        <button onClick={refetch} className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors">
          <RefreshCcw size={18} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : executions.length === 0 ? (
        <div className="max-w-md mx-auto px-4">
            <div className="text-center py-16 p-6 bg-white rounded-3xl border border-slate-200 border-dashed shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <AlertTriangle size={32} />
                </div>
                <p className="text-slate-600 font-bold">لا توجد مهام مرفوضة حالياً.</p>
                <p className="text-slate-400 text-xs mt-1">عمل رائع! كل مهامك معتمدة أو قيد التنفيذ.</p>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 p-4 md:p-6 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {executions.map((exec: any) => (
            <div key={exec.execution_id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between transition-all hover:shadow-md">
              <div>
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                     <span className="text-slate-800 font-bold font-mono text-sm tracking-wide">
                       {exec.booking_details?.booking_ref || exec.booking_ref || `#${exec.execution_id.split('-')[0]}`}
                     </span>
                  </div>
                  <span className="text-[10px] text-rose-900 bg-gray-100 border  px-2.5 py-1 rounded-lg font-bold">
                    مرفوضة
                  </span>
                </div>

                {/* تفاصيل العميل */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-slate-500">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold mb-0.5">اسم العميل</p>
                      <h3 className="text-sm font-bold text-slate-800">
                         {exec.booking_details?.contact_name || exec.contact_name || 'غير محدد'}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-slate-500">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold mb-0.5">العنوان</p>
                      <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-relaxed">
                         {exec.booking_details?.address || exec.address || 'غير محدد'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* زر الإجراء */}
              <button 
                onClick={() => setSelectedExecution(exec)}
                className="w-full bg-primary hover:bg-primary/70 text-white text-sm font-normal py-2 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
              >
                <Wrench size={16} /> فتح للتعديل وإعادة الإرسال
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedExecution && (
        <EditRejectedExecutionModal 
          execution={selectedExecution} 
          isOpen={!!selectedExecution} 
          onClose={() => setSelectedExecution(null)} 
        />
      )}
    </div>
  );
}