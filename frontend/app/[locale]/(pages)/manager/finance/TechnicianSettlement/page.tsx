"use client";

import React, { useState, useMemo } from "react";
import { 
  User, Briefcase, Wrench, ShieldCheck, Banknote, Loader2, 
  CreditCard, Search, FileText, CalendarClock, Hash, MapPin, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

import { 
  useGetPendingSettlementsQuery, 
  useExecuteSettlementMutation 
} from "@/redux/features/technicianEarningsApiSlice";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGetUsersListQuery } from "@/redux/features/authApiSlice";
import CompanySafeSelect from "@/components/treasury/CompanySafeSelect";
import AccountSelect from "@/components/treasury/AccountSelect";


import { generateTechnicianSettlementPDF } from "@/lib/pdf/TechnicianSettlementPDFDocument"; 

export default function TechnicianSettlementPage() {
  const [selectedTechId, setSelectedTechId] = useState<string>("");
  const [techSearchTerm, setTechSearchTerm] = useState<string>(""); 
  const [taskSearchTerm, setTaskSearchTerm] = useState<string>("");
  
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  
  const [selectedSafeId, setSelectedSafeId] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const { data: usersResponse, isLoading: isLoadingUsers } = useGetUsersListQuery("supervisor,technician");
  const usersList = usersResponse?.data || usersResponse || [];

  const filteredUsers = useMemo(() => {
    if (!techSearchTerm.trim()) return usersList;
    return usersList.filter((user: any) => 
      user?.full_name?.toLowerCase().includes(techSearchTerm.toLowerCase()) ||
      user?.name?.toLowerCase().includes(techSearchTerm.toLowerCase())
    );
  }, [usersList, techSearchTerm]);

  const { data: response, isFetching: isFetchingSettlements } = useGetPendingSettlementsQuery(Number(selectedTechId), {
    skip: !selectedTechId,
  });

  const [executeSettlement, { isLoading: isSettling }] = useExecuteSettlementMutation();

  const tasksArray = response?.data?.tasks || [];
  const advancesArray = response?.data?.advances || [];
  const summary = response?.data?.summary || { total_earnings: 0, total_advances: 0, net_amount: 0, visits_count: 0, services_count: 0 };

  const filteredTasks = useMemo(() => {
    if (!taskSearchTerm.trim()) return tasksArray;
    return tasksArray.filter((t: any) => 
      t.customer_name?.includes(taskSearchTerm) || 
      t.assignment_ref?.includes(taskSearchTerm) ||
      t.customer_phone?.includes(taskSearchTerm)
    );
  }, [tasksArray, taskSearchTerm]);

  const handleSettleSubmit = async () => {
    if (!selectedSafeId) return toast.error("يرجى اختيار خزنة الصرف.");
    if (!selectedAccountId) return toast.error("يرجى اختيار البند المحاسبي للتسوية.");

    try {
      await executeSettlement({ 
        technician_id: Number(selectedTechId), 
        safe_id: Number(selectedSafeId),
        account_id: Number(selectedAccountId)
      }).unwrap();
      
      toast.success("تمت التسوية بنجاح وتم صرف المبلغ للفني وتحديث الخزنة.");
      setIsSettleModalOpen(false);
      setSelectedSafeId("");
      setSelectedAccountId("");
      setSelectedTechId(""); 
      setTechSearchTerm("");
    } catch (err: any) {
      toast.error(err?.data?.message || "فشلت عملية التسوية.");
    }
  };

  const handlePrintPDF = () => {
    const technicianData = usersList.find((u: any) => u.id.toString() === selectedTechId);
    generateTechnicianSettlementPDF({
      technician: technicianData,
      tasks: tasksArray,
      advances: advancesArray,
      summary: summary
    });
  };

  return (
    <div className="flex flex-col max-w-dvw p-4 md:p-6 min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-50/50 text-slate-800" dir="rtl">
      
      {/* ===================== Header ===================== */}
      <div className="flex flex-col md:flex-row bg-primary rounded-2xl justify-between items-start md:items-center gap-5 p-5 md:p-6 shadow-sm border border-slate-200/80 mb-5 w-full">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 bg-white text-primary rounded-2xl flex items-center justify-center  border border-primary/20">
            <Banknote size={28} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col text-right">
            <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-slate-200">تسوية مستحقات الفنيين</h1>
            <p className="text-slate-200 mt-1 text-sm font-medium">مراجعة المهام المنجزة، خصم السلفيات، وصرف الصافي.</p>
          </div>
        </div>
      </div>

      {/* ===================== Select Technician Section ===================== */}
      <div className="bg-white border border-slate-200/80 shadow-sm p-5 sm:p-6 rounded-2xl w-full mb-6">
        <label className="block text-sm font-bold text-slate-700 mb-3">ابحث واختر الفني لإنشاء كشف الحساب:</label>
        
        <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-[600px]">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="اكتب اسم الفني للبحث..."
              value={techSearchTerm}
              onChange={(e) => setTechSearchTerm(e.target.value)}
              className="pr-10 h-12 rounded-xl border-slate-200 text-right bg-slate-50 focus-visible:ring-primary/20 font-semibold text-sm"
            />
          </div>

          <div className="w-full md:w-1/2">
            <Select value={selectedTechId} onValueChange={setSelectedTechId} disabled={isLoadingUsers}>
              <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 text-right font-semibold text-sm">
                <User className="w-4 h-4 ml-2 text-slate-400" />
                <SelectValue placeholder={isLoadingUsers ? "جاري التحميل..." : "اختر الفني من القائمة..."} />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-[300px]" dir="rtl">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((tech: any) => (
                    <SelectItem key={tech.id} value={tech.id.toString()} className="text-right py-3 font-normal  text-sm cursor-pointer">
                      {tech.full_name || tech.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500 font-medium">لا يوجد فني بهذا الاسم.</div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ===================== Loading & Empty States ===================== */}
      {isFetchingSettlements && (
        <div className="text-center py-20 text-slate-500 font-bold flex flex-col items-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
          جاري تجهيز كشف الحساب الدقيق...
        </div>
      )}

      {!isFetchingSettlements && selectedTechId && tasksArray.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-20 text-center text-slate-400 font-bold shadow-sm flex flex-col items-center justify-center transition-all animate-in fade-in">
          <ShieldCheck className="w-16 h-16 mb-4 opacity-30 text-primary" />
          <p className="text-lg text-slate-500">هذا الفني ليس لديه أي زيارات أو مستحقات معتمدة حالياً.</p>
        </div>
      )}

      {/* ===================== Settlement Data (Two Columns) ===================== */}
      {!isFetchingSettlements && tasksArray.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-6 items-start transition-all animate-in slide-in-from-bottom-4 duration-500">
          
          {/* ----- الجانب الأيمن (البيانات: مهام وسلف) ----- */}
          <div className="flex-1 w-full flex flex-col gap-6">
            
            {/* أ. شريط بحث المهام (جديد ومميز) */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div>
                <h2 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-md font-normal text-primary" /> تفاصيل الزيارات والمهام ({summary.visits_count})
                </h2>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="ابحث برقم المهمة أو العميل..."
                  value={taskSearchTerm}
                  onChange={(e) => setTaskSearchTerm(e.target.value)}
                  className="pr-10 h-10 rounded-xl border-slate-200 text-sm font-medium bg-slate-50 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            {/* ب. عرض كروت المهام (Visits) */}
            <div className="flex flex-col gap-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 font-medium text-sm">
                  لا توجد مهام مطابقة للبحث.
                </div>
              ) : (
                filteredTasks.map((task: any) => (
                  <div key={task.execution_id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">{task.customer_name}</h3>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5" /> {task.customer_phone}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-mono flex items-center gap-1">
                            <Hash className="w-3 h-3" /> {task.assignment_ref}
                          </span>
                          <span className="text-[11px] bg-primary/5 text-primary border border-primary/10 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
                            <CalendarClock className="w-3 h-3" /> {new Date(task.visit_date).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                          </span>
                        </div>
                      </div>
                      <div className="text-left bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
                        <span className="block text-[10px] text-emerald-600 font-extrabold uppercase mb-0.5">إجمالي المهمة</span>
                        <span className="font-extrabold font-mono text-lg text-emerald-700">
                          {Number(task.task_total_earned).toLocaleString()} ج.م
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">الخدمات المنفذة داخل الزيارة:</span>
                      {task.services.map((srv: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-slate-50 hover:bg-slate-100 transition-colors p-3 rounded-xl border border-slate-100/80">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <span className="font-bold text-slate-800 flex items-center gap-2">
                              <Wrench className="w-4 h-4 text-slate-400" /> {srv.service_name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
                              الكمية: <b className="text-slate-800">{Number(srv.service_quantity)}</b>
                            </span>
                          </div>
                          <span className="font-extrabold font-mono text-slate-900">{Number(srv.earned_amount).toLocaleString()} ج.م</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

     
          </div>

          {/* ----- الجانب الأيسر (بطاقة إجمالي الحساب Sticky) ----- */}
          <div className="w-full lg:w-[380px] bg-white border border-slate-200/80 rounded-2xl shadow-lg p-6 sticky top-6">
            <h3 className="font-extrabold text-slate-800 text-lg mb-5 text-center flex justify-center items-center gap-2">
              <Banknote className="text-primary w-5 h-5" /> ملخص كشف الحساب
            </h3>
            
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-sm font-bold text-slate-600">إجمالي الأرباح</span>
                <span className="font-extrabold font-mono text-slate-800">{Number(summary.total_earnings).toLocaleString()} ج.م</span>
              </div>
              
              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                <span className="text-sm font-bold text-blue-800">إجمالي السلف المخصومة</span>
                <span className="font-extrabold font-mono text-blue-700">- {Number(summary.total_advances).toLocaleString()} ج.م</span>
              </div>
            </div>

            <div className="bg-primary text-white p-6 rounded-2xl text-center mb-6 shadow-inner border border-primary/20">
              <span className="block text-primary-foreground/80 text-sm font-bold uppercase tracking-wider mb-2">الصافي المستحق للدفع</span>
              <span className="text-4xl font-mono font-extrabold text-white">
                {Number(summary.net_amount).toLocaleString()} <span className="text-lg text-primary-foreground/70">ج.م</span>
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => setIsSettleModalOpen(true)}
                disabled={Number(summary.net_amount) <= 0}
                className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-base shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-5 h-5 ml-2" />
                تأكيد التسوية والصرف
              </Button>

              <Button 
                onClick={handlePrintPDF}
                variant="outline"
                className="w-full h-12 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary font-bold text-sm shadow-sm transition-all"
              >
                <FileText className="w-4 h-4 ml-2" />
                تحميل (PDF)
              </Button>
            </div>
            
            {Number(summary.net_amount) <= 0 && (
              <p className="text-[11px] font-bold text-center text-rose-500 mt-4 leading-relaxed bg-rose-50 p-2 rounded-lg">
                لا يمكن إتمام التسوية. إجمالي السلف أكبر من أو يساوي الأرباح المستحقة.
              </p>
            )}
          </div>

        </div>
      )}






      <Dialog open={isSettleModalOpen} onOpenChange={setIsSettleModalOpen}>
        <DialogContent className="w-[92vw] sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-0 shadow-2xl" dir="rtl">
          <DialogHeader className="bg-slate-800 px-6 py-5 text-right m-0">
            <DialogTitle className="text-white font-extrabold text-xl flex items-center gap-2 m-0">
              <CreditCard className="text-white/80 w-6 h-6" />
              إصدار أمر الدفع المالي
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 bg-white flex flex-col gap-6">
            <div className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              سيتم سحب مبلغ <span className="font-extrabold text-emerald-600 font-mono text-lg">{Number(summary.net_amount).toLocaleString()} ج.م</span> من الخزنة ودفعه للفني.
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-extrabold text-slate-700">
                خزنة الصرف <span className="text-red-500">*</span>
              </label>
              <CompanySafeSelect 
                value={selectedSafeId}
                onChange={setSelectedSafeId}
                placeholder="اختر من أي خزنة سيخرج المبلغ..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-extrabold text-slate-700">
                توجيه المصروف (البند المحاسبي) <span className="text-red-500">*</span>
              </label>
              <AccountSelect 
                value={selectedAccountId}
                onChange={setSelectedAccountId}
                placeholder="مثال: رواتب، عمولات..."
              />
            </div>
          </div>

          <DialogFooter className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex-col sm:flex-row gap-3 sm:gap-2 m-0">
            <Button variant="outline" onClick={() => setIsSettleModalOpen(false)} className="rounded-xl h-12 font-bold w-full sm:w-28 text-slate-600 bg-white hover:bg-slate-50">إلغاء</Button>
            <Button 
              onClick={handleSettleSubmit} 
              disabled={isSettling}
              className="bg-primary text-white hover:bg-primary/90 rounded-xl h-12 font-bold flex-1 shadow-md"
            >
              {isSettling ? <><Loader2 className="w-5 h-5 animate-spin ml-2" /> جاري التنفيذ...</> : "تأكيد وصرف المبلغ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}