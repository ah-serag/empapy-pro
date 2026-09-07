"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Ban, 
  Banknote, 
  Loader2, 
  ShieldCheck,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

import { 
  useGetTechnicianEarningsQuery, 
  useApproveTechnicianEarningMutation,
  useCancelTechnicianEarningMutation // 🔴
} from "@/redux/features/technicianEarningsApiSlice";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import DateFilter from "@/components/shared/DateFilter";

export default function TechnicianEarningsPage() {
  const searchParams = useSearchParams();
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  // States للفلترة والبحث
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Dialog States
  const [earningToApprove, setEarningToApprove] = useState<any | null>(null);
  
  // 🔴 States الخاصة بالإلغاء
  const [earningToCancel, setEarningToCancel] = useState<any | null>(null);
  const [confirmCancelName, setConfirmCancelName] = useState("");

  // تأخير البحث
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleStatusChange = (val: string) => {
    setStatusFilter(val === "all" ? "" : val);
    setPage(1);
  };

  // جلب البيانات
  const { data: response, isLoading, isFetching } = useGetTechnicianEarningsQuery({
    search: debouncedSearch,
    status: statusFilter,
    start_date: startDate,
    end_date: endDate,
    page,
    limit,
  });

  const [approveEarning, { isLoading: isApproving }] = useApproveTechnicianEarningMutation();
  const [cancelEarning, { isLoading: isCanceling }] = useCancelTechnicianEarningMutation();

  const earningsList = response?.data || [];
  const meta = response?.meta || { totalPages: 1, currentTotalEarnings: 0 };

  // تنفيذ الاعتماد
  const handleConfirmApproval = async () => {
    if (!earningToApprove) return;
    try {
      await approveEarning(earningToApprove.id).unwrap();
      toast.success(`تم اعتماد عمولة ${earningToApprove.technician_name} بنجاح.`);
      setEarningToApprove(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "حدث خطأ أثناء اعتماد العمولة.");
    }
  };

  // تنفيذ الإلغاء
  const handleConfirmCancel = async () => {
    if (!earningToCancel) return;
    try {
      await cancelEarning(earningToCancel.id).unwrap();
      toast.success(`تم إلغاء عمولة ${earningToCancel.technician_name} نهائياً.`);
      setEarningToCancel(null);
      setConfirmCancelName(""); // تصفير حقل التأكيد
    } catch (err: any) {
      toast.error(err?.data?.message || "حدث خطأ أثناء الإلغاء.");
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 shadow-none font-bold"><Clock className="w-3 h-3 ml-1" /> معلق</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-none font-bold"><CheckCircle2 className="w-3 h-3 ml-1" /> معتمد</Badge>;
      case 'IN_SETTLEMENT':
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 shadow-none font-bold"><FileText className="w-3 h-3 ml-1" /> في كشف الحساب</Badge>;
      case 'PAID':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-none font-bold"><Banknote className="w-3 h-3 ml-1" /> تم الدفع</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-none font-bold"><Ban className="w-3 h-3 ml-1" /> ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col max-w-dvw p-4 md:p-6 min-h-screen bg-slate-50/50 w-full overflow-hidden" dir="rtl">
      
      {/* ===================== Header ===================== */}
      <div className="flex flex-col md:flex-row bg-primary rounded-2xl justify-between items-start md:items-center gap-5 p-5 md:p-6 shadow-md mb-6 w-full">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 bg-white rounded-xl flex items-center justify-center text-primary">
            <Wallet size={26} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col text-right">
            <h1 className="text-xl font-normal tracking-tight text-white">سجل العمولات والأرباح</h1>
            <p className="text-slate-300 mt-1 text-sm font-medium">مراقبة واعتماد مستحقات الفنيين الميدانيين بدقة.</p>
          </div>
        </div>
        <div className="bg-white/10 border border-white/20 p-3 rounded-xl w-full md:w-auto text-center md:text-right">
          <p className="text-[12px] text-slate-300 mb-0.5">إجمالي هذه الصفحة</p>
          <p className="text-xl font-mono font-bold text-emerald-200">{meta.currentTotalEarnings.toLocaleString()} ج.م</p>
        </div>
      </div>

      {/* ===================== Filters Section ===================== */}
      <div className="flex flex-col gap-4 bg-white border border-slate-200/60 shadow-sm p-5 md:p-6 rounded-2xl w-full mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          
          <div className="relative flex-1 w-full">
            <Search className="absolute right-4 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ابحث باسم الفني أو رقم المهمة (BK- / INV-...)"
              className="pr-11 pl-4 w-full rounded-xl border-slate-200 shadow-sm h-11 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary text-right"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Select onValueChange={handleStatusChange} value={statusFilter || "all"}>
              <SelectTrigger className="w-full sm:w-[220px] px-4 rounded-xl border-slate-200 shadow-sm h-11 bg-slate-50/50 focus:ring-2 focus:ring-primary/20 text-right">
                <SelectValue placeholder="حالة العمولة" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg" dir="rtl">
                <SelectItem value="all" className="rounded-lg">الكل (جميع الحالات)</SelectItem>
                <SelectItem value="PENDING" className="rounded-lg">معلق (بانتظار الاعتماد)</SelectItem>
                <SelectItem value="APPROVED" className="rounded-lg">معتمد (جاهز للتسوية)</SelectItem>
                <SelectItem value="IN_SETTLEMENT" className="rounded-lg">في كشف الحساب</SelectItem>
                <SelectItem value="PAID" className="rounded-lg">تم الدفع</SelectItem>
                <SelectItem value="CANCELLED" className="rounded-lg">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-100">
          <DateFilter />
        </div>
      </div>

      {/* ===================== Data Display ===================== */}
      {isFetching ? (
        <div className="text-center py-20 text-slate-500 font-bold flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
          جاري تحميل البيانات...
        </div>
      ) : earningsList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-20 text-center text-slate-400 font-bold shadow-sm flex flex-col items-center justify-center">
          <Wallet className="w-12 h-12 mb-3 opacity-20" />
          لا توجد سجلات أرباح تطابق بحثك أو التاريخ المحدد.
        </div>
      ) : (
        <>
          {/* 📱 MOBILE VIEW: CARDS */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {earningsList.map((earn: any) => (
              <div key={earn.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-[15px] text-slate-800">{earn.technician_name}</h4>
                    <span className="text-[11px] text-slate-500 mt-0.5 inline-block bg-slate-100 px-2 py-0.5 rounded-md">مهمة: {earn.assignment_ref}</span>
                  </div>
                  {renderStatusBadge(earn.status)}
                </div>
                
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-slate-500 font-bold">الخدمة:</span>
                    <span className="text-slate-800 font-medium truncate max-w-[180px]">{earn.service_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-slate-500 font-bold">التاريخ:</span>
                    <span className="text-slate-600">{format(new Date(earn.created_at), 'dd MMM yyyy - hh:mm a', { locale: ar })}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center mt-1">
                  <div className="flex flex-col text-right">
                    <span className="text-[11px] text-slate-500 font-bold mb-0.5">الوعاء: {earn.total_pool_amount} ج | نصيبه: {earn.user_shares} حصة</span>
                    <span className="text-xs font-bold text-slate-700">المبلغ المستحق:</span>
                  </div>
                  <span className="text-[16px] font-mono font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-100">
                    {Number(earn.earned_amount).toLocaleString()} ج.م
                  </span>
                </div>

                {/* أزرار الإجراءات للموبايل (لو الحالة PENDING) */}
                {earn.status === 'PENDING' && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100 border-dashed">
                    <Button 
                      size="sm"
                      onClick={() => setEarningToApprove(earn)}
                      className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      اعتماد
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => { setEarningToCancel(earn); setConfirmCancelName(""); }}
                      className="flex-1 h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      إلغاء
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 💻 DESKTOP VIEW: TABLE */}
          <div className="hidden lg:block bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[950px]">
                <TableHeader className="bg-slate-50 border-b border-slate-100">
                  <TableRow>
                    <TableHead className="text-right py-4 font-bold text-slate-600">اسم الفني</TableHead>
                    <TableHead className="text-right py-4 font-bold text-slate-600">رقم المهمة</TableHead>
                    <TableHead className="text-right py-4 font-bold text-slate-600">الخدمة المُنفذة</TableHead>
                    <TableHead className="text-center py-4 font-bold text-slate-600">المستحق (ج.م)</TableHead>
                    <TableHead className="text-center py-4 font-bold text-slate-600">الحالة</TableHead>
                    <TableHead className="text-right py-4 font-bold text-slate-600">التاريخ</TableHead>
                    <TableHead className="text-left py-4 font-bold text-slate-600">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earningsList.map((earn: any) => (
                    <TableRow key={earn.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-4 font-bold text-slate-800 whitespace-nowrap">{earn.technician_name}</TableCell>
                      <TableCell className="py-4 font-mono text-slate-600 whitespace-nowrap">{earn.assignment_ref}</TableCell>
                      <TableCell className="py-4 text-slate-700 font-medium whitespace-nowrap max-w-[200px] truncate">{earn.service_name}</TableCell>
                      
                      <TableCell className="text-center py-4 whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-mono font-bold text-[15px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                            {Number(earn.earned_amount).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1.5">الوعاء: {earn.total_pool_amount} | الحصص: {earn.user_shares}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center py-4 whitespace-nowrap">
                        <div className="flex justify-center">
                          {renderStatusBadge(earn.status)}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right py-4 text-[13px] text-slate-500 whitespace-nowrap">
                        {format(new Date(earn.created_at), 'yyyy/MM/dd hh:mm a')}
                      </TableCell>

                      {/* عمود الإجراءات للديسكتوب */}
                      <TableCell className="text-left py-4 whitespace-nowrap">
                        {earn.status === 'PENDING' ? (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm"
                              onClick={() => setEarningToApprove(earn)}
                              className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 ml-1" /> اعتماد
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => { setEarningToCancel(earn); setConfirmCancelName(""); }}
                              className="h-8 px-3 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-xs shadow-sm"
                            >
                              <XCircle className="w-3.5 h-3.5 ml-1" /> إلغاء
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium px-2">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* ===================== Pagination ===================== */}
          {meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button 
                variant="outline" 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)} 
                className="rounded-xl h-10 px-5 font-bold border-slate-200 hover:bg-slate-50 shadow-sm"
              >
                السابق
              </Button>
              <div className="bg-white border border-slate-200 h-10 px-5 flex items-center justify-center rounded-xl text-sm font-bold text-slate-600 shadow-sm">
                صفحة {page} من {meta.totalPages}
              </div>
              <Button 
                variant="outline" 
                disabled={page === meta.totalPages} 
                onClick={() => setPage(p => p + 1)} 
                className="rounded-xl h-10 px-5 font-bold border-slate-200 hover:bg-slate-50 shadow-sm"
              >
                التالي
              </Button>
            </div>
          )}
        </>
      )}

      {/* ===================== مودال تأكيد الاعتماد ===================== */}
      <AlertDialog open={!!earningToApprove} onOpenChange={() => setEarningToApprove(null)}>
        <AlertDialogContent className="w-[92vw] sm:max-w-[420px] rounded-3xl" dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="text-slate-900 font-bold flex items-center gap-2">
              <ShieldCheck className="text-blue-600 w-5 h-5" />
              تأكيد اعتماد العمولة
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-slate-600 mt-2 text-right">
              هل أنت متأكد من اعتماد عمولة الفني <span className="font-bold text-slate-900">{earningToApprove?.technician_name}</span> بمبلغ <span className="font-bold text-emerald-600 font-mono">{earningToApprove?.earned_amount} ج.م</span>؟ 
              <br />
              <span className="text-xs text-slate-400 mt-1 block">بعد الاعتماد ستصبح العمولة جاهزة للتسوية والصرف في كشف الحساب.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4 border-t pt-4">
            <AlertDialogCancel className="mt-0 border rounded-xl h-11 font-bold w-full sm:w-auto ml-2">إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleConfirmApproval(); }} 
              disabled={isApproving}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl h-11 font-bold w-full sm:w-auto"
            >
              {isApproving ? <><Loader2 className="w-4 h-4 animate-spin ml-1.5" /> جاري الاعتماد...</> : "تأكيد الاعتماد"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===================== مودال تأكيد الإلغاء (الحماية الذكية) ===================== */}
      <AlertDialog open={!!earningToCancel} onOpenChange={() => { setEarningToCancel(null); setConfirmCancelName(""); }}>
        <AlertDialogContent className="w-[92vw] sm:max-w-[420px] rounded-3xl" dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="text-rose-600 font-bold flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              إلغاء استحقاق مالي
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-slate-600 mt-2 text-right">
              هذا الإجراء سيقوم بحذف قيمة العمولة ({earningToCancel?.earned_amount} ج.م) من حساب الفني ولن تُدرج في راتبه.
              <br /><br />
              يرجى كتابة اسم الفني <span className="font-bold text-slate-900 select-all bg-slate-100 px-1 py-0.5 rounded">"{earningToCancel?.technician_name}"</span> للتأكيد:
            </AlertDialogDescription>
            <div className="mt-3">
              <Input 
                value={confirmCancelName}
                onChange={(e) => setConfirmCancelName(e.target.value)}
                placeholder="اكتب اسم الفني هنا..."
                className="h-11 rounded-xl text-center font-bold text-slate-800"
                autoComplete="off"
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4 border-t pt-4">
            <AlertDialogCancel className="mt-0 border rounded-xl h-11 font-bold w-full sm:w-auto ml-2">تراجع</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleConfirmCancel(); }} 
              disabled={isCanceling || confirmCancelName !== earningToCancel?.technician_name}
              className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl h-11 font-bold w-full sm:w-auto disabled:opacity-50"
            >
              {isCanceling ? <><Loader2 className="w-4 h-4 animate-spin ml-1.5" /> جاري الإلغاء...</> : "تأكيد الحذف نهائياً"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}