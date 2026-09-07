"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { HandCoins, Loader2, Building2, UserCircle } from "lucide-react";
import { useCreateAdvanceMutation } from "@/redux/features/advancesApiSlice";
import CompanySafeSelect from "@/components/treasury/CompanySafeSelect";
import AccountSelect from "@/components/treasury/AccountSelect";
import { TechnicianWalletSelect } from "@/components/treasury/TechnicianWalletSelect";
import { useGetUsersListQuery } from "@/redux/features/authApiSlice";

const advanceSchema = z.object({
  user_id: z.string().min(1, { message: "يرجى اختيار الموظف أو الفني المستلم" }),
  sourceType: z.enum(["TECH_WALLET", "MAIN_SAFE"]),
  taken_from_safe_id: z.string().min(1, { message: "يرجى تحديد مصدر الصرف" }),
  account_id: z.string().min(1, { message: "التوجيه المحاسبي مطلوب" }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "المبلغ يجب أن يكون رقماً صحيحاً أكبر من صفر",
  }),
  notes: z.string().optional(),
});

type AdvanceFormValues = z.infer<typeof advanceSchema>;

export interface UserData {
  id: number;
  full_name: string;
}

interface AddAdvanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAdvanceDialog({ isOpen, onClose }: AddAdvanceDialogProps) {
  const [createAdvance, { isLoading: isSubmitting }] = useCreateAdvanceMutation();
  const { data: usersResponse, isLoading: isLoadingUsers } = useGetUsersListQuery("supervisor,admin,technician", {
    skip: !isOpen,
  });
  const usersList: UserData[] = usersResponse?.data || [];

  const form = useForm<AdvanceFormValues>({
    resolver: zodResolver(advanceSchema),
    defaultValues: {
      user_id: "",
      sourceType: "TECH_WALLET",
      taken_from_safe_id: "",
      account_id: "",
      amount: "",
      notes: "",
    },
  });

  const watchSourceType = form.watch("sourceType");

  const onSubmit = async (data: AdvanceFormValues) => {
    try {
      await createAdvance({
        user_id: Number(data.user_id),
        taken_from_safe_id: Number(data.taken_from_safe_id),
        account_id: Number(data.account_id),
        amount: Number(data.amount),
        notes: data.notes || "",
      }).unwrap();
      toast.success("تم تسجيل السلفة وإثباتها محاسبياً بنجاح");
      form.reset();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "حدث خطأ أثناء تسجيل السلفة");
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="w-[95vw] sm:max-w-[550px] p-0 border-0 rounded-2xl sm:rounded-[2rem] overflow-hidden gap-0 bg-white flex flex-col h-[90vh] max-h-[90vh]"
        dir="rtl"
      >
        {/* ================= HEADER (Fixed) ================= */}
        <DialogHeader className="bg-primary px-4 sm:px-6 py-4 sm:py-5 border-b border-primary/10 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl text-white">
            <HandCoins className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <span className="font-bold">صرف سلفة نقدية</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 bg-white">
          
          {/* ================= SCROLLABLE BODY (100% Working) ================= */}
          <div className="flex-1 overflow-hidden relative">
            <ScrollArea className="h-full w-full" dir="rtl">
              <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6">
                
                <Controller
                  control={form.control}
                  name="user_id"
                  render={({ field, fieldState }) => (
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label className={`text-xs sm:text-[13px] ${fieldState.error ? "text-red-500" : "text-slate-700 font-semibold"}`}>
                        الفني / الموظف المستفيد
                      </Label>
                      {isLoadingUsers ? (
                        <div className="flex items-center h-11 sm:h-12 px-4 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-500 w-full">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary shrink-0" /> <span className="truncate">جاري تحميل الموظفين...</span>
                        </div>
                      ) : (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger
                            className={`h-11 sm:h-12 px-4 rounded-xl transition-all text-xs sm:text-sm w-full ${
                              fieldState.error
                                ? "border-red-500 focus:ring-red-500/20"
                                : "border-slate-200 focus:ring-primary/20 focus:border-primary bg-slate-50 hover:bg-white"
                            }`}
                          >
                            <SelectValue placeholder="اختر الموظف أو الفني المستلم..." />
                          </SelectTrigger>
                          <SelectContent dir="rtl" className="rounded-xl shadow-xl max-h-48 text-xs sm:text-sm w-full">
                            {usersList.length === 0 ? (
                              <div className="p-3 text-center text-slate-500">لا يوجد موظفين مسجلين</div>
                            ) : (
                              usersList.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()} className="font-medium cursor-pointer py-2 sm:py-2.5">
                                  {user.full_name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      {fieldState.error && <p className="text-[10px] sm:text-[11px] text-red-500 font-medium">{fieldState.error.message}</p>}
                    </div>
                  )}
                />

                <div className="p-3.5 sm:p-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 space-y-4 sm:space-y-5">
                  <Label className="text-primary font-bold text-sm sm:text-base">مصدر صرف السلفة</Label>
                  
                  <div className="flex flex-col sm:flex-row bg-transparent sm:bg-slate-200/70 p-0 sm:p-1.5 rounded-none sm:rounded-xl gap-2 sm:gap-0 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue("sourceType", "TECH_WALLET");
                        form.setValue("taken_from_safe_id", "");
                        form.clearErrors("taken_from_safe_id");
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl sm:rounded-lg transition-all duration-300 w-full ${
                        watchSourceType === "TECH_WALLET"
                          ? "bg-white sm:bg-white text-primary shadow-md border sm:border-0 border-slate-200 sm:ring-1 ring-slate-200"
                          : "bg-slate-100 sm:bg-transparent text-slate-500 hover:text-slate-800 border border-slate-100 sm:border-0"
                      }`}
                    >
                      <UserCircle className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" /> عهدة فني
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue("sourceType", "MAIN_SAFE");
                        form.setValue("taken_from_safe_id", "");
                        form.clearErrors("taken_from_safe_id");
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl sm:rounded-lg transition-all duration-300 w-full ${
                        watchSourceType === "MAIN_SAFE"
                          ? "bg-white sm:bg-white text-primary shadow-md border sm:border-0 border-slate-200 sm:ring-1 ring-slate-200"
                          : "bg-slate-100 sm:bg-transparent text-slate-500 hover:text-slate-800 border border-slate-100 sm:border-0"
                      }`}
                    >
                      <Building2 className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" /> خزنة شركة
                    </button>
                  </div>

                  <div className="pt-1">
                    <Controller
                      control={form.control}
                      name="taken_from_safe_id"
                      render={({ field, fieldState }) => (
                        <div className="space-y-1.5 sm:space-y-2">
                          {watchSourceType === "TECH_WALLET" ? (
                            <TechnicianWalletSelect value={field.value} onChange={field.onChange} 
                          />
                          ) : (
                            <CompanySafeSelect
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="اختر خزنة الشركة التي سيتم الصرف منها..."
                              className="text-xs sm:text-sm h-11 sm:h-12 rounded-xl w-full"
                            />
                          )}
                          {fieldState.error && <p className="text-[10px] sm:text-[11px] text-red-500 font-medium">{fieldState.error.message}</p>}
                        </div>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
                  <Controller
                    control={form.control}
                    name="amount"
                    render={({ field, fieldState }) => (
                      <div className="space-y-1.5 sm:space-y-2 w-full">
                        <Label className={`text-xs sm:text-[13px] ${fieldState.error ? "text-red-500" : "text-slate-700 font-semibold"}`}>
                          المبلغ (ج.م)
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          className={`px-4 h-11 sm:h-12 font-extrabold text-base sm:text-lg rounded-xl transition-all shadow-sm w-full ${
                            fieldState.error
                              ? "border-red-500 focus-visible:ring-red-500/20"
                              : "border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary text-primary bg-slate-50 focus:bg-white"
                          }`}
                          placeholder="0.00"
                          {...field}
                        />
                        {fieldState.error && <p className="text-[10px] sm:text-[11px] text-red-500 font-medium">{fieldState.error.message}</p>}
                      </div>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="account_id"
                    render={({ field, fieldState }) => (
                      <div className="space-y-1.5 sm:space-y-2 w-full">
                        <Label className={`text-xs sm:text-[13px] ${fieldState.error ? "text-red-500" : "text-slate-700 font-semibold"}`}>
                          التوجيه المحاسبي
                        </Label>
                        <div className={`w-full ${fieldState.error ? "rounded-xl ring-2 ring-red-500/30 border border-red-500 overflow-hidden" : ""}`}>
                          <AccountSelect
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="اختر حساب السلف..."
                            error={!!fieldState.error}
                          />
                        </div>
                        {fieldState.error && <p className="text-[10px] sm:text-[11px] text-red-500 font-medium">{fieldState.error.message}</p>}
                      </div>
                    )}
                  />
                </div>

                <Controller
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <div className="space-y-1.5 sm:space-y-2 w-full">
                      <Label className="text-xs sm:text-[13px] text-slate-700 font-semibold">ملاحظات البيان (اختياري)</Label>
                      <Textarea
                        placeholder="اكتب سبب السلفة أو أي تفاصيل إضافية هنا..."
                        className="px-4 py-3 resize-none h-20 sm:h-24 rounded-xl border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary transition-all bg-slate-50 focus:bg-white shadow-sm text-xs sm:text-sm w-full"
                        {...field}
                      />
                    </div>
                  )}
                />
              </div>
            </ScrollArea>
          </div>

          {/* ================= FOOTER (Fixed) ================= */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 shrink-0 w-full z-10">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-28 h-11 sm:h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-white transition-all font-bold shadow-sm text-xs sm:text-sm"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all font-bold text-xs sm:text-sm"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />}
              تسجيل واعتماد
            </Button>
          </div>
          
        </form>
      </DialogContent>
    </Dialog>
  );
}