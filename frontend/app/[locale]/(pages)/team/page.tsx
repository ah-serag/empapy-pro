"use client"
import React, { useMemo } from 'react';
import { Loader2, Inbox, Users, ShieldAlert, AlertCircle } from 'lucide-react';
import { useGetSupervisorAssignmentsQuery } from '@/redux/features/TeamApiSlice';
import AssignmentCard from '@/components/Team/AssignmentCard';
import { Assignment } from '@/components/Team/ViewDetailsModal';
import RefreshButton from '@/components/shared/RefreshButton'; 
import  {AssignmentCardSkeleton}  from '@/components/Team/AssignmentCardSkeleton';
import { ScrollArea } from "@/components/ui/scroll-area"; 

interface AssignmentsResponse {
  success: boolean;
  message?: string;
  count: number;
  data: Assignment[];
}

interface FetchError {
  status: number;
  data?: {
    success: boolean;
    message: string;
  };
}

export default function AssignmentsPage() {
  const { 
    data: response, 
    isLoading, 
    error, 
    refetch,
    isFetching
  } = useGetSupervisorAssignmentsQuery<any>(undefined);

  // 1. استخراج البيانات بأمان
  const safeResponse = response as AssignmentsResponse;
  const assignments = safeResponse?.data || [];
  const count = safeResponse?.count || 0;
  const teamName = assignments[0]?.team_details?.team_name;

  // 2. خوارزمية الترتيب الذكية والآمنة (بدون أي أخطاء TypeScript)
  const sortedAssignments = useMemo(() => {
    if (!assignments || assignments.length === 0) return [];

    return [...assignments].sort((a, b) => {
      const activeStatuses = ['IN_PROGRESS', 'STARTED', 'ACTIVE', 'ON_WAY'];

      // استخراج الحالة بأمان تام لتجاوز قيود TypeScript (مع دعم أي مسمى للحالة)
      const statusA = String((a as any)?.status || (a as any)?.assignment_status || '').toUpperCase();
      const statusB = String((b as any)?.status || (b as any)?.assignment_status || '').toUpperCase();

      const aIsActive = activeStatuses.includes(statusA);
      const bIsActive = activeStatuses.includes(statusB);

      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;

      // ترتيب المهام المتشابهة حسب الأحدث
      return ((b as any)?.assignment_id || 0) - ((a as any)?.assignment_id || 0);
    });
  }, [assignments]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <AssignmentCardSkeleton />
        <AssignmentCardSkeleton />
        <AssignmentCardSkeleton />
      </div>
    );
  }

  if (error) {
    const fetchError = error as FetchError;

    if (fetchError.status === 403) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 " dir="rtl">
          <div className="bg-white p-8 rounded-2xl border border-red-100 flex flex-col items-center text-center gap-4 w-full max-w-md shadow-sm">
            <div className="p-4 bg-red-50 rounded-full text-red-600">
              <ShieldAlert size={40} />
            </div>
            <div>
              <h2 className="text-red-700 font-bold text-lg mb-2">الفريق موقوف</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                {fetchError.data?.message || "الفريق الخاص بك غير مفعل حالياً، يرجى التواصل مع الإدارة."}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // خطأ عام (انقطاع نت أو سيرفر)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 flex flex-col items-center text-center gap-5 w-full max-w-md shadow-sm">
          <div className="p-4 bg-gray-50 rounded-full text-gray-400">
            <AlertCircle size={40} />
          </div>
          <div>
            <h2 className="text-gray-700 font-bold text-lg mb-2">عذراً، حدث خطأ</h2>
            <p className="text-gray-500 text-sm">
              {fetchError.data?.message || "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى."}
            </p>
          </div>
          
          <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="text" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10 pt-0" dir="rtl">
      
      <div className="sticky bg-[#f8f8ff] backdrop-blur-md top-0 z-10 border pt-0 shadow-sm border-gray-200/50">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 text-bold rounded-xl text-primary">
              <Users size={18} />
            </div>
            <h1 className="text-primary font-bold text-sm truncate max-w-[180px]">
              {teamName || 'فريق العمل'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-primary/5 rounded-full">
              <span className="text-sm font-bold text-primary">{count}</span>
              <span className="text-sm font-bold  text-primary">مهمة</span>
            </div>
            
            <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon" />
          </div>

        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)] w-full mt-6" dir="rtl">
        <div className="max-w-md mx-auto px-3 pb-6">
          
          {/* حالة عدم وجود مهام */}
          {sortedAssignments.length === 0 ? (
            <div className="mt-16 flex flex-col items-center justify-center text-center gap-4 p-8 bg-white border border-gray-100 rounded-3xl shadow-sm">
              <div className="p-5 bg-gray-50 rounded-full text-gray-300">
                <Inbox size={40} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-gray-500 font-bold text-base mb-1.5">لا توجد مهام حالياً</p>
                <p className="text-gray-500 text-sm">أنتظر تعيين مهام جديدة من الإدارة.</p>
              </div>
              
              <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="text" />
            </div>
          ) : (
            
            /* الكروت - الآن ستظهر المهام قيد التنفيذ في الأعلى دائماً بدون أخطاء TypeScript */
            <div className="flex flex-col gap-4">
              {sortedAssignments.map((assignment: Assignment) => (
                <AssignmentCard 
                  key={assignment.assignment_id} 
                  assignment={assignment} 
                />
              ))}
            </div>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}