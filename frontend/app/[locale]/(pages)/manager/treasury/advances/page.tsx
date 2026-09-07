"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Wallet, 
  User, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  HandCoins, 
  Loader2,
  XCircle,
  AlertTriangle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { useGetAdvancesQuery, useCancelAdvanceMutation } from "@/redux/features/advancesApiSlice";
import { AddAdvanceDialog } from "@/components/treasury/AddAdvanceDialog";

export interface AdvanceRecord {
  id: number;
  amount: string | number;
  status: 'PENDING' | 'DEDUCTED' | 'CANCELLED';
  notes: string;
  created_at: string;
  deducted_at: string | null;
  employee_name: string;
  safe_name: string;
  created_by_name: string | null;
}

export interface PaginationData {
  total_records: number;
  current_page: number;
  total_pages: number;
  limit: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export default function AdvancesPage() {
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>(""); 
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);

  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<number | null>(null);
  const [confirmationInput, setConfirmationInput] = useState<string>("");

  const { data: response, isLoading, isFetching } = useGetAdvancesQuery({ 
    page, 
    limit: 10, 
    search: searchTerm 
  });

  const [cancelAdvance, { isLoading: isCancelling }] = useCancelAdvanceMutation();

  const advances: AdvanceRecord[] = response?.data || [];
  const pagination: PaginationData = response?.pagination || {
    total_records: 0, current_page: 1, total_pages: 1, limit: 10, has_next_page: false, has_prev_page: false
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleOpenCancelModal = (id: number) => {
    setSelectedAdvanceId(id);
    setConfirmationInput("");
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAdvanceId) return;

    if (String(confirmationInput).trim() !== String(selectedAdvanceId)) {
      toast.error("رقم السلفة غير مطابق، يرجى كتابة الرقم الصحيح للتأكيد");
      return;
    }

    try {
      await cancelAdvance(selectedAdvanceId).unwrap();
      toast.success("تم إلغاء السلفة واسترداد المبلغ للخزنة بنجاح");
      setCancelModalOpen(false);
      setSelectedAdvanceId(null);
      setConfirmationInput("");
    } catch (err: any) {
      toast.error(err?.data?.message || "فشل إلغاء السلفة");
    }
  };

  const getStatusBadge = (status: AdvanceRecord['status']) => {
    switch (status) {
      case 'PENDING': 
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-2.5 py-0.5 text-[11px] font-medium shadow-none">
            <Clock className="w-3 h-3 ml-1"/> معلقة
          </Badge>
        );
      case 'DEDUCTED': 
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2.5 py-0.5 text-[11px] font-medium shadow-none">
            <CheckCircle2 className="w-3 h-3 ml-1"/> تم الخصم
          </Badge>
        );
      case 'CANCELLED': 
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200 px-2.5 py-0.5 text-[11px] font-medium shadow-none">
            <XCircle className="w-3 h-3 ml-1"/> ملغاة
          </Badge>
        );
      default: 
        return <Badge className="text-[11px]">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-dvw bg-slate-50/50 min-h-[calc(100vh-4rem)] text-xs sm:text-sm" dir="rtl">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-800">
            <div className="bg-white p-2 shadow-md border rounded-full border-gray-100">
            <HandCoins className="w-5 h-5 text-primary" />

            </div>
            سجل السلفيات والعهد
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            متابعة وتسجيل السلف النقدية المسحوبة من الخزن وعهد الفنيين
          </p>
        </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
  <form onSubmit={(e) => e.preventDefault()} className="relative w-full sm:w-72 group">
    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none z-10">
      <Search className="w-4 h-4" />
    </span>
    <Input 
      type="text" 
      placeholder="ابحث باسم الموظف..." 
      className="pr-10 pl-4 h-10 rounded-xl border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary text-xs sm:text-sm font-normal transition-all bg-slate-50/50 shadow-none"
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
    />
  </form>
  
  <Button 
    onClick={() => setIsAddOpen(true)} 
    className="w-full sm:w-auto h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all font-semibold text-xs sm:text-sm"
  >
    <Plus className="w-4 h-4 ml-1.5" /> صرف سلفة جديدة
  </Button>
</div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-slate-500 font-medium text-xs sm:text-sm">جاري التحميل...</p>
        </div>
      ) : advances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
            <HandCoins className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium text-xs sm:text-sm">
            {searchTerm ? "لا توجد نتائج مطابقة لبحثك." : "لا توجد سلفيات مسجلة."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {advances.map((adv) => (
              <div key={adv.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">{adv.employee_name}</span>
                  </div>
                  {getStatusBadge(adv.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">مبلغ السلفة</span>
                    <span className="font-bold text-sm text-primary">{Number(adv.amount).toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">مصدر التمويل</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 w-fit">
                      <Wallet className="w-3 h-3 text-slate-400"/> {adv.safe_name}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col mt-1 pt-2 border-t border-slate-50">
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-primary/60"/> 
                        {new Date(adv.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                      </span>
                    </div>
                  </div>
                </div>

                {adv.status === 'PENDING' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-1 h-8 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleOpenCancelModal(adv.id)}
                  >
                    <X className="w-3.5 h-3.5 ml-1" /> إلغاء السلفة
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-slate-50/70 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent text-xs">
                    <TableHead className="py-3.5 font-bold text-slate-600">الموظف / المستلم</TableHead>
                    <TableHead className="py-3.5 font-bold text-slate-600">المبلغ</TableHead>
                    <TableHead className="py-3.5 font-bold text-slate-600">مصدر التمويل</TableHead>
                    <TableHead className="py-3.5 font-bold text-slate-600">تاريخ التسجيل</TableHead>
                    <TableHead className="py-3.5 font-bold text-slate-600">الحالة</TableHead>
                    <TableHead className="py-3.5 font-bold text-slate-600 text-left">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {advances.map((adv) => (
                    <TableRow key={adv.id} className="hover:bg-primary/5 transition-colors border-slate-100">
                      <TableCell className="py-3 font-semibold text-slate-800 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        {adv.employee_name}
                      </TableCell>
                      <TableCell className="py-3 font-bold text-primary text-sm">
                        {Number(adv.amount).toLocaleString('ar-EG')} ج.م
                      </TableCell>
                      <TableCell className="py-3 font-medium text-slate-600">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60 w-fit">
                          <Wallet className="w-3.5 h-3.5 text-slate-400"/> {adv.safe_name}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-slate-500 font-medium">
                        {new Date(adv.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="py-3">
                        {getStatusBadge(adv.status)}
                      </TableCell>
                      <TableCell className="py-3 text-left">
                        {adv.status === 'PENDING' && (
                          <Button 
                            variant="ghost" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold h-7 px-2.5 text-xs rounded-lg"
                            size="sm"
                            onClick={() => handleOpenCancelModal(adv.id)}
                          >
                            إلغاء
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between bg-white p-3.5 sm:p-4 border border-slate-200/80 rounded-2xl shadow-sm mt-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-medium text-slate-500">
                <span className="hidden sm:inline">إجمالي السلف:</span>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5">{pagination.total_records}</Badge>
                <span className="mx-1 text-slate-300">|</span>
                <span>صفحة <b className="text-primary">{pagination.current_page}</b> من {pagination.total_pages}</span>
              </div>
              <div className="flex gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-all px-3 text-xs"
                  disabled={!pagination.has_prev_page || isFetching} 
                  onClick={() => setPage(prev => prev - 1)}
                >
                  <ChevronRight className="w-3.5 h-3.5 ml-1" /> السابق
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-all px-3 text-xs"
                  disabled={!pagination.has_next_page || isFetching} 
                  onClick={() => setPage(prev => prev + 1)}
                >
                  التالي <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                </Button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* مودال تأكيد إلغاء السلفة برقم المستند */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-0 border-0 rounded-2xl overflow-hidden bg-white shadow-xl text-xs sm:text-sm" dir="rtl">
          <DialogHeader className="bg-rose-600 px-5 py-4 m-0">
            <DialogTitle className="flex items-center gap-2 text-base text-white font-bold">
              <AlertTriangle className="w-5 h-5 text-white" />
              <span>تأكيد إلغاء السلفة رقم ({selectedAdvanceId})</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleConfirmCancel} className="p-5 space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs leading-relaxed font-medium">
              تنبيه هام: سيتم إلغاء هذه السلفة وإرجاع المبلغ بالكامل إلى الخزنة أو العهدة المرتبطة بها. لضمان عدم الحذف بالخطأ، يرجى كتابة رقم السلفة في الحقل أدناه.
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-xs">اكتب رقم السلفة ({selectedAdvanceId}) للتأكيد:</Label>
              <Input
                type="text"
                placeholder={`أدخل الرقم ${selectedAdvanceId}`}
                className="h-10 rounded-xl border-slate-200 text-center font-bold text-sm tracking-widest focus-visible:ring-rose-500/20 focus-visible:border-rose-500"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                autoFocus
              />
            </div>

            <DialogFooter className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl border-slate-200 text-slate-600 text-xs font-semibold"
                onClick={() => setCancelModalOpen(false)}
              >
                تراجع
              </Button>
              <Button
                type="submit"
                disabled={isCancelling || String(confirmationInput).trim() !== String(selectedAdvanceId)}
                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {isCancelling && <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />}
                تأكيد الإلغاء والاسترداد
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddAdvanceDialog 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
      />
    </div>
  );
}