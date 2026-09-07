"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserCog, AlertCircle } from "lucide-react";

import { useUpsertTechnicianProfileMutation } from "@/redux/features/technicianProfileApiSlice";
import { useGetUsersListQuery } from "@/redux/features/authApiSlice";

interface TechnicianProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: any | null; 
}

export default function TechnicianProfileModal({ open, onOpenChange, profile }: TechnicianProfileModalProps) {
  const isEditing = !!profile;
  
  const { data: usersResponse, isLoading: isLoadingUsers } = useGetUsersListQuery("supervisor,technician");
  const usersList = usersResponse?.data || [];

  const [upsertProfile, { isLoading: isSubmitting }] = useUpsertTechnicianProfileMutation();

  const { handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      user_id: "",
      tier: "",
    }
  });

  const selectedUserId = watch("user_id");
  const selectedTier = watch("tier");

  useEffect(() => {
    if (open) {
      if (isEditing && profile) {
        setValue("user_id", profile.user_id.toString());
        setValue("tier", profile.tier);
      } else {
        reset({ user_id: "", tier: "" });
      }
    }
  }, [open, isEditing, profile, reset, setValue]);

  const onSubmit = async (data: any) => {
    if (!data.user_id || !data.tier) {
      toast.error("يرجى اختيار الفني وتحديد الرتبة الوظيفية.");
      return;
    }

    try {
      await upsertProfile({ 
        user_id: Number(data.user_id), 
        tier: data.tier 
      }).unwrap();
      
      toast.success(isEditing ? "تم تحديث رتبة الفني بنجاح." : "تم تعيين الرتبة للفني بنجاح.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "حدث خطأ أثناء حفظ البيانات.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px] w-[95vw] p-0 border-0 rounded-3xl bg-white shadow-2xl overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-primary px-6 py-5 shrink-0 z-10 text-right">
          <DialogTitle className="font-bold text-[18px] text-white flex items-center justify-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
              <UserCog size={18} />
            </div>
            {isEditing ? "تعديل الرتبة الوظيفية" : "تعيين رتبة مالية جديدة"}
          </DialogTitle>
          <p className="text-[12px] text-primary-foreground/80 mt-1.5 pr-11 text-right">
            حدد الفني والرتبة التي تحدد حصته المالية من عمولات المهام.
          </p>
        </div>

        {/* Form */}
        <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 bg-slate-50/50">
          
          <div className="space-y-2 text-right">
            <label className="block text-[13px] font-bold text-slate-700">الفني / المشرف <span className="text-red-500">*</span></label>
            <Select 
              disabled={isEditing || isLoadingUsers} 
              value={selectedUserId} 
              onValueChange={(val) => setValue("user_id", val)}
            >
              <SelectTrigger dir="rtl" className="rounded-xl px-4 text-right bg-white border-slate-200 h-12 text-[13px] focus:ring-primary/20 shadow-sm w-full">
                <SelectValue placeholder={isLoadingUsers ? "جاري التحميل..." : "اختر الفني من القائمة"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 max-w-fit shadow-xl max-h-[250px]" dir="rtl">
                {usersList.map((u: any) => (
                  <SelectItem key={u.id} value={u.id.toString()} className="text-right font-normal focus:bg-slate-50">
                    {u.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditing && <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><AlertCircle size={12}/> لا يمكن تغيير الفني في وضع التعديل.</p>}
          </div>

          <div className="space-y-2 text-right">
            <label className="block text-[13px] font-bold text-slate-700">الرتبة (تحدد الحصة المالية) <span className="text-red-500">*</span></label>
            <Select value={selectedTier} onValueChange={(val) => setValue("tier", val)}>
              <SelectTrigger dir="rtl" className="rounded-xl px-4 text-right bg-white border-slate-200 h-12 text-[13px] focus:ring-primary/20 shadow-sm w-full">
                <SelectValue placeholder="اختر الرتبة" />
              </SelectTrigger>
              <SelectContent className="rounded-xl w-fit border-slate-200 shadow-xl" dir="rtl">
                <SelectItem value="LEAD" className="text-right font-bold text-indigo-800 focus:bg-indigo-50 py-2">
                  قائد (أسطى) - يحصل على حصتين
                </SelectItem>
                <SelectItem value="ASSISTANT" className="text-right font-bold text-emerald-800 focus:bg-emerald-50 py-2">
                  مساعد (صنايعي) - يحصل على حصة واحدة
                </SelectItem>
                <SelectItem value="TRAINEE" className="text-right font-bold text-amber-800 focus:bg-amber-50 py-2">
                  متدرب - يحصل على نصف حصة
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

        </form>

        {/* Footer */}
        <div className="bg-white border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="rounded-xl h-11 px-8 w-full sm:w-auto border-slate-200 text-slate-600 font-bold hover:bg-slate-50 shadow-sm order-2 sm:order-1"
          >
            إلغاء
          </Button>
          
          <Button 
            type="submit" 
            form="profile-form"
            disabled={isSubmitting || !selectedUserId || !selectedTier} 
            className="rounded-xl h-11 px-10 bg-primary text-white hover:bg-primary/95 font-bold w-full sm:w-auto shadow-md order-1 sm:order-2 transition-all active:scale-[0.98]"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري الحفظ...</>
            ) : "حفظ التعديلات"}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}