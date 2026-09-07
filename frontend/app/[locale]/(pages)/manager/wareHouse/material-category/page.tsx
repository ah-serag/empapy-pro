

"use client";

import { useTranslations } from "next-intl";
import { Trash2, Loader2, Layers } from "lucide-react";

import { 
  useGetMaterialCategoriesQuery, 
  useDeleteMaterialCategoryMutation 
} from '@/redux/features/wareHouse';

import { CreateCategoryForm } from '@/components/manager/wareHouse/CreateCategoryForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CategoriesDisplay } from "@/components/manager/wareHouse/CategoriesDisplay";
import { toast } from "sonner";

export default function MaterialCategoriesPage() {
  const t = useTranslations("Warehouse.Categories");
  
  const { data: categoriesResponse, isLoading: isFetching } = useGetMaterialCategoriesQuery(undefined);
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteMaterialCategoryMutation();

  const categories = categoriesResponse?.data || [];

const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id).unwrap();
      
      toast.success( "تم حذف القسم بنجاح.");
      
    } catch (error: any) {

      const errorMessage = error?.data?.message || "حدث خطأ أثناء حذف القسم.";
      
      toast.error(errorMessage);
    }
  };

  return (



    <div className="flex-col">


         <div className="flex flex-row items-center m-3 rounded-2xl shadow-md flex-wrap gap-4 bg-white p-5 border border-slate-200/60 ">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 p-2 flex items-center justify-center text-primary">
            <Layers size={24} className="font-light" />
          </div>
          <div>
            <h1 className="text-2xl  font-light tracking-tight text-primary">
              {t("title") || "إدارة أقسام المخزن"}
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-light">
              {t("subtitle") || "قم بإضافة وتنظيم الأقسام الرئيسية والفرعية للخامات."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6 min-h-screen text-slate-900 w-full overflow-hidden bg-slate-50/50">
      
      {/* Header Card */}
   

      {/* Form Card */}
      <CreateCategoryForm categories={categories} />

      {/* Data Section */}
      <div className="w-full">
        {isFetching ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400 font-light shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50 mb-2" />
            <span>جاري التحميل...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400 font-light shadow-sm">
            {t("noData") || "لا توجد أقسام مسجلة حتى الآن."}
          </div>
        ) : (
          <>
            {/* Mobile View (Cards) */}
            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {categories.map((category: any) => {
                const parentName = category.parent_id 
                  ? categories.find((c: any) => c.id === category.parent_id)?.name 
                  : null;

                return (
                  <div key={category.id} className="bg-white border border-slate-200/60 rounded-2xl shadow-sm space-y-4 overflow-hidden">
                    <div className="flex items-center bg-slate-50/50 rounded-t-2xl p-5 border-b border-slate-100 justify-between">
                      <span className="font-mono text-xs bg-primary/10 text-primary px-3 py-1 rounded-lg font-semibold tracking-wide">
                        #{category.id}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() => handleDelete(category.id)}
                        className="h-8 w-8 p-0 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3 p-5 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{t("tableName") || "اسم القسم"}</span>
                        <span className="text-sm font-medium text-slate-800">{category.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{t("tableParent") || "متفرع من"}</span>
                        {parentName ? (
                          <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                            {parentName}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden lg:block bg-white border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden w-full">
              <div className="overflow-x-auto w-full">
                <CategoriesDisplay 
               categories={categories} 
              isLoading={isFetching} 
                 isDeleting={isDeleting}
               onDelete={handleDelete} 
                   />
              </div>
            </div>
          </>
        )}
      </div>

    </div>
    </div>

    
  );
}