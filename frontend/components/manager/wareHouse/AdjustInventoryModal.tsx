'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { useAdjustInventoryMutation } from '@/redux/features/wareHouse'; 

interface AdjustInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: any; // بيانات الصنف الذي سيتم تعديل كميته
}

export function AdjustInventoryModal({ open, onOpenChange, material }: AdjustInventoryModalProps) {
  const t = useTranslations('Warehouse.Materials');
  const [adjustInventory, { isLoading }] = useAdjustInventoryMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      quantity_change: '',
      warehouse_name: 'المخزن الرئيسي' // اسم المخزن الافتراضي بناءً على الباك إند
    }
  });

  // إعادة ضبط الفورم عند الفتح
  React.useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (values: any) => {
    try {
      const quantityChange = parseFloat(values.quantity_change);
      
      if (isNaN(quantityChange) || quantityChange === 0) {
        toast.error('يرجى إدخال كمية صحيحة.');
        return;
      }

      await adjustInventory({
        material_id: material.id,
        warehouse_name: values.warehouse_name,
        quantity_change: quantityChange
      }).unwrap();

      toast.success(`تم ${quantityChange > 0 ? 'إضافة' : 'خصم'} الكمية بنجاح.`);
      onOpenChange(false);
      reset();
    } catch (error: any) {
      toast.error(error?.data?.error || 'حدث خطأ أثناء تعديل الكمية.');
    }
  };

  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] w-[95vw] rounded-2xl shadow-xl border-slate-200/60 bg-white p-0 overflow-hidden gap-0">
        
        {/* Header - bg-secondary text-white */}
        <DialogHeader className="px-4 sm:px-6 py-5 bg-secondary flex-shrink-0 z-10 m-0 border-b-0">
          <DialogTitle className="font-medium text-xl text-white tracking-tight">
            تعديل رصيد: {material.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          
          <div className="flex-1 p-4 sm:p-6 space-y-6">
            
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-semibold text-slate-700">
                الكمية (موجب للإضافة، سالب للخصم)
              </label>
              <Input 
                type="number"
                step="0.5"
                placeholder="مثال: 50 أو -10"
                {...register('quantity_change', { required: 'يرجى إدخال الكمية' })} 
                className="px-4 rounded-xl border-slate-200/60 shadow-sm h-11 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-secondary/30 focus-visible:border-secondary transition-all font-mono text-base sm:text-sm"
              />
              {errors.quantity_change && <p className="text-xs font-medium text-red-500 pl-1">{errors.quantity_change.message as string}</p>}
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-semibold text-slate-700">المخزن</label>
              <Input 
                {...register('warehouse_name')} 
                readOnly
                className="px-4 rounded-xl border-slate-200/60 shadow-none h-11 bg-slate-100 text-slate-500 cursor-not-allowed transition-all text-base sm:text-sm"
              />
              <p className="text-xs text-slate-400 pl-1">مؤقتاً يتم الإضافة للمخزن الرئيسي فقط.</p>
            </div>

          </div>

          {/* Footer - Buttons */}
          <DialogFooter className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-white flex-shrink-0 flex-col sm:flex-row gap-3 m-0 z-10">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="rounded-xl shadow-sm border-slate-200 w-full sm:w-auto h-11 hover:bg-slate-50 font-bold text-slate-700 transition-colors order-2 sm:order-1"
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="rounded-xl shadow-sm bg-secondary hover:bg-secondary/90 text-white border-none w-full sm:w-auto h-11 flex items-center justify-center gap-2 font-bold transition-all order-1 sm:order-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ الرصيد
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}