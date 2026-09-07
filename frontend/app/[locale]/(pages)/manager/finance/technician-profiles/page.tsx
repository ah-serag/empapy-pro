"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Plus, PencilLine, AlertCircle } from "lucide-react";
import RefreshButton from "@/components/shared/RefreshButton";
import TechnicianProfileModal from "@/components/manager/finance/TechnicianProfileModal"; 
import { useGetTechnicianProfilesQuery } from "@/redux/features/technicianProfileApiSlice";

export default function TechnicianProfilesPage() {
  const { data: response, isLoading, isFetching, refetch, isError } = useGetTechnicianProfilesQuery({});
  const profiles = response?.data || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  const openAddModal = () => {
    setSelectedProfile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (profile: any) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  };

  const renderTierBadge = (tier: string) => {
    switch (tier) {
      case "LEAD": return <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200 px-3 py-1 font-bold shadow-none rounded-lg">قائد (LEAD)</Badge>;
      case "ASSISTANT": return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 px-3 py-1 font-bold shadow-none rounded-lg">مساعد (ASSISTANT)</Badge>;
      case "TRAINEE": return <Badge className="bg-amber-50 text-amber-800 border-amber-200 px-3 py-1 font-bold shadow-none rounded-lg">متدرب (TRAINEE)</Badge>;
      default: return <Badge variant="outline">{tier}</Badge>;
    }
  };

  return (
    <div className="flex flex-col p-2 lg:p-4 min-h-screen bg-slate-50/50" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row bg-primary rounded-2xl flex-wrap justify-between items-start md:items-center gap-5 p-5 sm:p-6 shadow-md mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 bg-white rounded-xl flex items-center justify-center text-primary">
            <ShieldCheck size={26} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-normal tracking-tight text-white">الرتب المالية للفنيين</h1>
              {!isLoading && (
                <Badge className="bg-white text-primary rounded-lg font-bold px-3 py-0.5 text-[12px] shadow-sm">
                  {profiles.length}
                </Badge>
              )}
            </div>
            <p className="text-primary-foreground/80 mt-1 text-sm font-medium">
              تحديد رتب الفنيين وحصصهم المالية الافتراضية لحساب العمولات.
            </p>
          </div>
        </div>

        <div className="flex flex-row items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={openAddModal}
            className="flex-1 md:flex-none bg-white text-primary hover:bg-slate-50 rounded-xl shadow-sm flex items-center justify-center gap-2 px-6 h-11 transition-all font-bold text-sm"
          >
            <Plus size={18} strokeWidth={2.5} /> 
            تعيين رتبة لفني
          </Button>
          <div className="bg-white p-1.5 rounded-xl backdrop-blur-sm">
            <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon"  />
          </div>
        </div>
      </div>

      <div className="w-full">
        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 font-medium shadow-sm">
            جاري تحميل البيانات...
          </div>
        ) : isError ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-rose-500 font-bold shadow-sm">
            حدث خطأ أثناء الاتصال بالخادم.
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 font-medium shadow-sm flex flex-col items-center justify-center gap-3">
            <AlertCircle size={40} className="opacity-20" />
            لا يوجد فنيين مسند إليهم رتب وظيفية حتى الآن.
          </div>
        ) : (
          <>
            {/* 📱 Mobile View (Cards) */}
            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {profiles.map((p: any) => (
                <div key={p.profile_id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 text-[15px]">{p.full_name}</h3>
                      <p className="text-slate-500 text-[12px] mt-0.5">{p.email}</p>
                    </div>
                    {renderTierBadge(p.tier)}
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-[12px] text-slate-500 font-bold">الحصص المالية (الوزن):</span>
                    <span className="text-[14px] font-mono font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                      {p.default_shares} حصة
                    </span>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={() => openEditModal(p)}
                    className="w-full h-10 rounded-xl font-bold text-primary border-primary/20 hover:bg-primary/5"
                  >
                    <PencilLine size={16} className="ml-2" /> تعديل الرتبة
                  </Button>
                </div>
              ))}
            </div>

            {/* 💻 Desktop View (Table) */}
            <div className="hidden lg:block bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden w-full">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-100">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-slate-500 py-4 text-right">اسم الفني</TableHead>
                    <TableHead className="font-semibold text-slate-500 py-4 text-right">الرتبة الوظيفية</TableHead>
                    <TableHead className="font-semibold text-slate-500 py-4 text-center">عدد الحصص (الوزن المالي)</TableHead>
                    <TableHead className="font-semibold text-slate-500 py-4 text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p: any) => (
                    <TableRow key={p.profile_id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[14px] font-bold text-slate-800">{p.full_name}</span>
                          <span className="text-[12px] text-slate-500">{p.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {renderTierBadge(p.tier)}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <span className="text-[14px] font-mono font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          {p.default_shares} حصة
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <Button 
                          variant="ghost" 
                          onClick={() => openEditModal(p)}
                          className="h-9 px-4 rounded-xl text-primary font-bold hover:bg-primary/5"
                        >
                          <PencilLine size={15} className="ml-1.5" /> تعديل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <TechnicianProfileModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        profile={selectedProfile}
      />
    </div>
  );
}