'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, QrCode } from 'lucide-react';
import { toast } from 'sonner';

import { useAddSerialMutation, useGetMaterialsQuery } from '@/redux/features/wareHouse';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddSerialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMaterialId?: string; 
}

export function AddSerialModal({ open, onOpenChange, defaultMaterialId }: AddSerialModalProps) {
  const t = useTranslations('Warehouse.Serials'); // استخدام الترجمة
  
  // تعريف الـ Schema جوه الـ Component عشان نقدر نستخدم دالة الترجمة t() للرسائل
  const addSerialSchema = z.object({
    material_id: z.string().min(1, t('validation.materialRequired') || 'يجب اختيار الصنف'),
    serial_number: z.string()
      .min(4, t('validation.serialTooShort') || 'السيريال قصير جداً')
      .max(100, t('validation.serialTooLong') || 'السيريال طويل جداً'),
  });

  type AddSerialValues = z.infer<typeof addSerialSchema>;

  const { data: materialsResponse, isLoading: isLoadingMaterials } = useGetMaterialsQuery(undefined);
  
  const serializedMaterials = (materialsResponse?.data || []).filter(
    (mat: any) => mat.is_serialized === true
  );

  const [addSerial, { isLoading: isAdding }] = useAddSerialMutation();

  const { register, handleSubmit, control, reset, setValue, setFocus, formState: { errors } } = useForm<AddSerialValues>({
    resolver: zodResolver(addSerialSchema),
    defaultValues: {
      material_id: defaultMaterialId || '',
      serial_number: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (defaultMaterialId) {
        setValue('material_id', defaultMaterialId);
      } else {
        reset();
      }
      setTimeout(() => setFocus('serial_number'), 100);
    }
  }, [open, defaultMaterialId, reset, setValue, setFocus]);

  const onSubmit = async (values: AddSerialValues) => {
    try {
      const cleanSerial = values.serial_number.trim().toUpperCase();
      
      const payload = {
        material_id: values.material_id,
        serial_number: cleanSerial,
      };

      await addSerial(payload).unwrap();
      
      toast.success(t('messages.success') || 'تمت إضافة السيريال وزيادة الرصيد بنجاح');
      
      setValue('serial_number', '');
      setFocus('serial_number');

    } catch (error: any) {
      toast.error(error?.data?.error || error?.data?.message || t('messages.error') || 'حدث خطأ أثناء حفظ السيريال');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-[24px] shadow-2xl border-slate-200/60 bg-white p-0 overflow-hidden gap-0">
        
        <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100 m-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
              <QrCode className="w-5 h-5 text-secondary" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="font-medium text-xl text-slate-800 ">
                {t('modalTitle') || 'إضافة سيريال للجهاز'}
              </DialogTitle>
              <span className="text-xs font-medium text-slate-500">
                {t('modalSubtitle') || 'إضافة السيريال تزيد الرصيد بمقدار (+1) تلقائياً'}
              </span>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          
          <div className="p-6 space-y-5 bg-white">
            
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-semibold text-slate-700">{t('materialLabel') || 'تحديد الصنف'}</label>
              <Controller
                control={control}
                name="material_id"
                render={({ field }) => (
                  <Select 
                    disabled={isLoadingMaterials || !!defaultMaterialId} 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <SelectTrigger className="px-4 rounded-xl border-slate-200/60 shadow-sm h-12 bg-slate-50/50 hover:bg-slate-50 focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all text-sm font-semibold">
                      <SelectValue placeholder={isLoadingMaterials ? (t('loadingMaterials') || "جاري التحميل...") : (t('selectMaterialPlaceholder') || "اختر الصنف...")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-[30vh]">
                      {serializedMaterials.map((mat: any) => (
                        <SelectItem key={mat.id} value={mat.id} className="font-medium text-slate-700 rounded-lg focus:bg-secondary/10 focus:text-secondary">
                          {mat.name} <span className="text-slate-400 text-xs ml-2">({mat.sku})</span>
                        </SelectItem>
                      ))}
                      {serializedMaterials.length === 0 && !isLoadingMaterials && (
                        <div className="p-3 text-center text-sm text-slate-500">
                          {t('noMaterialsFound') || 'لا توجد أصناف تتطلب سيريالات'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.material_id && <p className="text-xs font-medium text-red-900 pl-1">{errors.material_id.message}</p>}
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-semibold text-slate-700">{t('serialLabel') || 'رقم السيريال المطبوع على الجهاز'}</label>
              <div className="relative">
                <Input 
                  {...register('serial_number')} 
                  placeholder={t('serialPlaceholder') || 'مثال: CARRIER-INV-99201'}
                  className="px-4 rounded-xl border-slate-200/60 shadow-sm h-14 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-secondary/30 focus-visible:border-secondary transition-all text-base font-mono uppercase tracking-wider pl-12"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <QrCode className="w-5 h-5 opacity-50" />
                </div>
              </div>
              {errors.serial_number && <p className="text-xs font-medium text-red-500 pl-1">{errors.serial_number.message}</p>}
            </div>

          </div>

          <DialogFooter className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex-col sm:flex-row gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              className="rounded-xl hover:bg-slate-200/50 font-bold text-slate-600 transition-colors w-full sm:w-auto h-11 order-2 sm:order-1"
            >
              {t('cancelBtn') || 'إلغاء'}
            </Button>
            <Button 
              type="submit" 
              disabled={isAdding}
              className="rounded-xl shadow-md shadow-secondary/20 bg-secondary hover:bg-secondary/90 text-white border-none w-full sm:w-auto h-11 flex items-center justify-center gap-2 font-bold transition-all order-1 sm:order-2"
            >
              {isAdding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {t('saveBtn') || 'حفظ السيريال'}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}