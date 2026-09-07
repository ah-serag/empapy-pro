'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { materialSchema, MaterialFormValues } from '@/lib/validation/warehouse';
import { 
  useCreateMaterialMutation, 
  useUpdateMaterialMutation,
  useGetMaterialCategoriesQuery 
} from '@/redux/features/wareHouse';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface MaterialFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialToEdit?: any; 
}

export function MaterialFormModal({ open, onOpenChange, materialToEdit }: MaterialFormModalProps) {
  const t = useTranslations('Warehouse.Materials');
  
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useGetMaterialCategoriesQuery(undefined);
  const categories = categoriesResponse?.data || [];

  const [createMaterial, { isLoading: isCreating }] = useCreateMaterialMutation();
  const [updateMaterial, { isLoading: isUpdating }] = useUpdateMaterialMutation();
  
  const isEditing = !!materialToEdit;
  const isLoading = isCreating || isUpdating;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      sku: '',
      category_id: 0,
      current_cost: 0,
      current_price: 0,
      unit: 'قطعة', 
      is_serialized: false,
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (isEditing && materialToEdit) {
        reset({
          name: materialToEdit.name || '',
          sku: materialToEdit.sku || '',
          category_id: materialToEdit.category_id || 0,
          current_cost: materialToEdit.current_cost || 0,
          current_price: materialToEdit.current_price || 0,
          unit: materialToEdit.unit || 'قطعة',
          is_serialized: Boolean(materialToEdit.is_serialized),
          is_active: Boolean(materialToEdit.is_active),
        });
      } else {
        reset({
          name: '',
          sku: '',
          category_id: 0,
          current_cost: 0,
          current_price: 0,
          unit: 'قطعة', 
          is_serialized: false,
          is_active: true,
        });
      }
    }
  }, [open, isEditing, materialToEdit, reset]);

  const onSubmit = async (values: MaterialFormValues) => {
    try {
      const payload = {
        ...values,
        is_serialized: Boolean(values.is_serialized),
        is_active: Boolean(values.is_active),
      };

      if (isEditing) {
        await updateMaterial({ id: materialToEdit.id, ...payload }).unwrap();
        toast.success(t('form.editSuccess') || 'تم تحديث بيانات الصنف بنجاح.');
      } else {
        await createMaterial(payload).unwrap();
        toast.success(t('form.createSuccess') || 'تمت إضافة الصنف بنجاح.');
      }
      onOpenChange(false);
      reset();
    } catch (error: any) {
      toast.error(error?.data?.message || t('form.error') || 'حدث خطأ أثناء حفظ البيانات.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] flex flex-col rounded-2xl shadow-xl border-slate-200/60 bg-white p-0 overflow-hidden gap-0">
        
        <DialogHeader className="px-4 sm:px-6 py-5 bg-secondary flex-shrink-0 z-10 m-0 border-b-0">
          <DialogTitle className="font-medium text-xl sm:text-2xl text-white tracking-tight">
            {isEditing ? (t('form.editTitle') || 'تعديل بيانات الصنف') : (t('form.createTitle') || 'إضافة صنف جديد')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              
              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-semibold text-slate-700">{t('form.name') || 'اسم الصنف'}</label>
                <Input 
                  {...register('name')} 
                  className="px-4 rounded-xl border-slate-200/60 shadow-sm h-11 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-secondary/30 focus-visible:border-secondary transition-all text-base sm:text-sm"
                />
                {errors.name && <p className="text-xs font-medium text-red-950 pl-1">{errors.name.message as string}</p>}
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-semibold text-slate-700">{t('form.sku') || 'كود الصنف (SKU)'}</label>
                <Input 
                  {...register('sku')} 
                  className="px-4 rounded-xl border-slate-200/60 shadow-sm h-11 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-secondary/30 focus-visible:border-secondary transition-all font-mono text-base sm:text-sm"
                />
                {errors.sku && <p className="text-xs font-medium text-red-950 pl-1">{errors.sku.message as string}</p>}
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-semibold text-slate-700">{t('form.category') || 'القسم التابع له'}</label>
                <Controller
                  control={control}
                  name="category_id"
                  render={({ field }) => (
                    <Select 
                      disabled={isLoadingCategories} 
                      onValueChange={(val) => field.onChange(Number(val))} 
                      value={field.value ? field.value.toString() : ''}
                    >
                      <SelectTrigger className="px-4 rounded-xl border-slate-200/60 shadow-sm h-11 bg-slate-50/50 focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all text-base sm:text-sm">
                        <SelectValue placeholder={isLoadingCategories ? "جاري التحميل..." : "اختر القسم..."} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-[40vh]">
                        {categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id.toString()} className="font-medium text-slate-700 rounded-lg focus:bg-secondary/10 focus:text-secondary">
                            {cat.parent_id ? <span className="text-slate-400 mr-2">└</span> : null}
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category_id && <p className="text-xs font-medium text-red-950 pl-1">{errors.category_id.message as string}</p>}
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-semibold text-slate-700">{t('form.unit') || 'وحدة القياس'}</label>
                <Input 
                  placeholder="مثال: قطعة، متر، كجم"
                  {...register('unit')} 
                  className="px-4 rounded-xl border-slate-200/60 shadow-sm h-11 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-secondary/30 focus-visible:border-secondary transition-all text-base sm:text-sm"
                />
                {errors.unit && <p className="text-xs font-medium text-red-950 pl-1">{errors.unit.message as string}</p>}
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-semibold text-slate-700">{t('form.currentCost') || 'التكلفة (Current Cost)'}</label>
                <Input 
                  type="number"
                  step="0.01"
                  {...register('current_cost', { valueAsNumber: true })} 
                  className="px-4 rounded-xl border-slate-200/60 shadow-sm h-11 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-secondary/30 focus-visible:border-secondary transition-all font-mono text-base sm:text-sm"
                />
                {errors.current_cost && <p className="text-xs font-medium text-red-950 pl-1">{errors.current_cost.message as string}</p>}
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-semibold text-slate-700">{t('form.currentPrice') || 'سعر البيع (Current Price)'}</label>
                <Input 
                  type="number"
                  step="0.01"
                  {...register('current_price', { valueAsNumber: true })} 
                  className="px-4 rounded-xl border-slate-200/60 shadow-sm h-11 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-secondary/30 focus-visible:border-secondary transition-all font-mono text-base sm:text-sm"
                />
                {errors.current_price && <p className="text-xs font-medium text-red-950 pl-1">{errors.current_price.message as string}</p>}
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              <Controller
                control={control}
                name="is_serialized"
                render={({ field }) => (
                  <div className="flex items-center gap-4 p-4 border border-slate-200/60 rounded-xl hover:bg-slate-50/50 hover:border-secondary/30 transition-all group">
                    <Switch
                      id="is_serialized_toggle"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-secondary"
                    />
                    <div className="flex flex-col">
                      <label htmlFor="is_serialized_toggle" className="text-sm font-bold text-slate-800 group-hover:text-secondary transition-colors cursor-pointer">
                        {t('form.isSerialized') || 'يتطلب سيريالات'}
                      </label>
                      <span className="text-xs text-slate-500 font-medium mt-1 leading-relaxed hidden sm:block">
                        تفعيل هذا الخيار لإدارة الصنف بالقطعة.
                      </span>
                    </div>
                  </div>
                )}
              />

              <Controller
                control={control}
                name="is_active"
                render={({ field }) => (
                  <div className="flex items-center gap-4 p-4 border border-slate-200/60 rounded-xl hover:bg-slate-50/50 hover:border-secondary/30 transition-all group">
                    <Switch
                      id="is_active_toggle"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-secondary"
                    />
                    <div className="flex flex-col">
                      <label htmlFor="is_active_toggle" className="text-sm font-bold text-slate-800 group-hover:text-secondary transition-colors cursor-pointer">
                        {t('form.isActive') || 'الصنف نشط'}
                      </label>
                      <span className="text-xs text-slate-500 font-medium mt-1 leading-relaxed hidden sm:block">
                        اجعل الصنف متاحاً للبيع وللظهور في النظام.
                      </span>
                    </div>
                  </div>
                )}
              />
              
            </div>
          </div>

          <DialogFooter className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-white flex-shrink-0 flex-col sm:flex-row gap-3 m-0 z-10">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="rounded-xl shadow-sm border-slate-200 w-full sm:w-auto h-11 hover:bg-slate-50 font-bold text-slate-700 transition-colors order-2 sm:order-1"
            >
              {t('form.cancel') || 'إلغاء'}
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="rounded-xl shadow-sm bg-secondary hover:bg-secondary/90 text-white border-none w-full sm:w-auto h-11 flex items-center justify-center gap-2 font-bold transition-all order-1 sm:order-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? (t('form.saveChanges') || 'حفظ التعديلات') : (t('form.save') || 'إضافة الصنف')}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}