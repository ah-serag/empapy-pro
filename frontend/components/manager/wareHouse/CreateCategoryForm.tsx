"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2, RollerCoaster } from "lucide-react";

import { categoryFormSchema, CategoryFormValues } from '@/lib/validation/warehouse';
import { useCreateMaterialCategoryMutation } from '@/redux/features/wareHouse';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface CreateCategoryFormProps {
  categories: any[];
}

export function CreateCategoryForm({ categories }: CreateCategoryFormProps) {
  const t = useTranslations("Warehouse.Categories");
  const [createCategory, { isLoading }] = useCreateMaterialCategoryMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      parent_id: "none",
    },
  });

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      const payload = {
        name: values.name,
        parent_id: values.parent_id !== "none" ? Number(values.parent_id) : null,
      };
      const result = await createCategory(payload).unwrap();
      reset();
      toast.success("تم الإضافة بنجاح");
    } catch (error) {
       const errorMessage =  "حدث خطأ اثناء الاضافة";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-white border border-slate-200/60 shadow-sm p-3 sm:p-4 rounded-xl w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 w-full">
        
        {/* حقل الاسم */}
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-slate-700">
            {t("categoryName") || "اسم القسم"}
          </label>
          <Input 
            placeholder={t("categoryNamePlaceholder") || "مثال: قطع غيار تكييف"} 
            className="w-full rounded-lg border-slate-200 px-3 shadow-sm h-9 bg-slate-50/50 text-[12px] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
            {...register("name")} 
          />
          {errors.name && (
            <p className="text-[10px] font-bold text-red-500 px-1">{errors.name.message}</p>
          )}
        </div>

        {/* حقل القسم الأب */}
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-slate-700">
            {t("parentCategory") || "القسم الرئيسي (إن وُجد)"}
          </label>
          <Controller
            control={control}
            name="parent_id"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full px-3 rounded-lg border-slate-200 shadow-sm h-9 bg-slate-50/50 text-[12px] focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder={t("selectParent") || "اختر القسم الأب"} />
                </SelectTrigger>
                <SelectContent className="rounded-lg mt-1 border-slate-200 shadow-lg" dir="rtl">
                  <SelectItem value="none" className="rounded-md text-primary font-bold text-[12px]">
                     {t("mainCategory") || "قسم رئيسي "} 
                  </SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()} className="rounded-md text-[12px] font-medium">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* الزر */}
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg shadow-sm flex items-center justify-center gap-1.5 px-4 h-9 text-[12px] font-bold transition-all mt-1 active:scale-[0.98]"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus size={14} />}
          <span>{t("saveBtn") || "إضافة القسم"}</span>
        </Button>
        
      </form>
    </div>
  );
}