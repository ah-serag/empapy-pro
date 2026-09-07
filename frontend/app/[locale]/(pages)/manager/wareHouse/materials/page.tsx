'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, MoreHorizontal, Package, AlertTriangle, CheckCircle2, Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';

import { 
  useGetMaterialsQuery, 
  useDeactivateMaterialMutation,
} from '@/redux/features/wareHouse';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

import { MaterialFormModal } from '@/components/manager/wareHouse/MaterialFormModal';
import { AdjustInventoryModal } from '@/components/manager/wareHouse/AdjustInventoryModal';
import { AddSerialModal } from '@/components/manager/wareHouse/AddSerialModal'; // 🔴 استيراد مودال السيريالات
import RefreshButton from '@/components/shared/RefreshButton';

export default function MaterialsPage() {
  const t = useTranslations('Warehouse.Materials');
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  
  // States Modal 1: Create/Edit Material
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<any>(null);

  // States Modal 2: Adjust Inventory (بدون سيريال)
  const [isAdjustInventoryOpen, setIsAdjustInventoryOpen] = useState(false);
  const [materialToAdjust, setMaterialToAdjust] = useState<any>(null);

  // States Modal 3: Add Serial (بالسيريال) 🔴
  const [isAddSerialOpen, setIsAddSerialOpen] = useState(false);
  const [materialToAddSerial, setMaterialToAddSerial] = useState<string | undefined>(undefined);

  // Queries & Mutations
  const { data: materialsResponse, isLoading, refetch, isFetching } = useGetMaterialsQuery(undefined);
  const [deactivateMaterial] = useDeactivateMaterialMutation();
  
  const materials = materialsResponse?.data || [];

  // فلترة للبحث
  const filteredMaterials = useMemo(() => {
    return materials.filter((m: any) => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [materials, searchTerm]);

  // إحصائيات للمدير (KPIs)
  const totalItems = materials.length;
  const activeItems = materials.filter((m: any) => m.is_active).length;

  const handleDeactivate = async (id: number, currentStatus: boolean) => {
    try {
      await deactivateMaterial(id).unwrap();
      toast.success(currentStatus ? 'تم إيقاف الصنف بنجاح' : 'تم تفعيل الصنف بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء تغيير حالة الصنف');
    }
  };

  const openEditModal = (material: any) => {
    setMaterialToEdit(material);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setMaterialToEdit(null);
    setIsModalOpen(true);
  };

  const openAdjustInventoryModal = (material: any) => {
    setMaterialToAdjust(material);
    setIsAdjustInventoryOpen(true);
  };

  // 🔴 فتح مودال السيريالات وتمرير الـ ID بتاع الصنف
  const openAddSerialModal = (materialId: string) => {
    setMaterialToAddSerial(materialId);
    setIsAddSerialOpen(true);
  };

  return (

     <div className='flex-col'>
       <div className="flex flex-col  m-3 p-4   gap-3">
        <div className="flex flex-row flex-wrap rounded-xl  items-center shadow-sm bg-primary p-3 px-5 border border-slate-200/60 justify-between  md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-slate-200">
              {t('title') || 'الكتالوج والأرصدة'}
            </h1>
            <p className="text-slate-200 mt-1 text-sm font-light">
              {t('subtitle') || 'إدارة الأصناف، تتبع الكميات، وتحديث أسعار الخامات.'}
            </p>
          </div>
          <div className='bg-white rounded-full'>
          <RefreshButton onRefresh={refetch} isFetching={isFetching} variant="icon" />

          </div>
        </div>

        <div className="grid grid-cols-1 p-3 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-light mb-1">{t('kpi.totalItems') || 'إجمالي الأصناف'}</p>
              <h3 className="text-2xl font-medium text-text-primary">{totalItems}</h3>
            </div>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Package size={24} className="font-light" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1">
            <div>
              <p className="text-sm text-slate-500 font-light mb-1">{t('kpi.active') || 'أصناف نشطة'}</p>
              <h3 className="text-2xl font-medium text-emerald-800">{activeItems}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={24} className="font-light" />
            </div>
          </div>
        </div>
      </div>
    <div className="p-4 md:p-6 space-y-4 min-h-screen text-slate-900 w-full overflow-hidden bg-slate-50/50">
      
      {/* 1. Header & KPIs */}
     

      {/* 2. شريط البحث والأدوات (Toolbar) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute right-4 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('searchPlaceholder') || 'ابحث باسم الصنف أو الكود...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-11 pl-4 rounded-xl border-slate-200/60 shadow-sm h-11 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary w-full"
          />
        </div>
        
        <Button 
          onClick={openCreateModal}
          className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm h-11 px-6 flex items-center justify-center gap-2 transition-all"
        >
          <Plus size={18} /> {t('addBtn') || 'إضافة صنف جديد'}
        </Button>
      </div>

      {/* 3. شبكة الكروت (Smart Grid Display) */}
      <div className="w-full">
        {isLoading ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50 mb-3" />
            <span className="text-slate-400 font-light">جاري تحميل الأصناف...</span>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-16 text-center text-slate-400 font-light shadow-sm">
            لا توجد أصناف مطابقة لعملية البحث.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {filteredMaterials.map((material: any) => {
              const stockPercent = Math.min((material.quantity / 20) * 100, 100);
              const isCritical = material.quantity < 5;
              
              return (
                <div key={material.id} className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md group">
                  
                  {/* Header الخاص بالكارت */}
                  <div className="flex justify-between bg-gray-200 items-center p-3">
                    <Badge className={`${material.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'} rounded-full shadow-none font-medium px-2.5 py-0.5 border-none text-xs`}>
                      {material.is_active ? (t('kpi.active') || 'نشط') : (t('kpi.inactive') || 'متوقف')}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg text-primary hover:bg-slate-50 hover:text-primary transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200/60 shadow-lg bg-white p-1">
                        <DropdownMenuLabel className="font-light text-xs text-slate-400 px-2 py-1.5 uppercase tracking-wider">
                          إجراءات المخزن
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        
                        <DropdownMenuItem onClick={() => openEditModal(material)} className="rounded-lg cursor-pointer text-slate-700 focus:bg-slate-50 focus:text-primary transition-colors">
                          {t('actions.edit') || 'تعديل بيانات الصنف'}
                        </DropdownMenuItem>

                        {material.is_serialized ? (
                          <DropdownMenuItem 
                            onClick={() => openAddSerialModal(material.id)} 
                            className="rounded-lg cursor-pointer font-bold text-secondary focus:bg-secondary/10 focus:text-secondary transition-colors mt-1"
                          >
                            <QrCode className="w-4 h-4 mr-2" />
                            {t('actions.addSerial') || 'إضافة جهاز (سيريال جديد)'}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => openAdjustInventoryModal(material)} 
                            className="rounded-lg cursor-pointer font-bold text-slate-700 focus:bg-slate-100 focus:text-slate-900 transition-colors mt-1"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('actions.adjust') || 'تعديل الكمية يدوياً'}
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator className="bg-slate-100 mt-1" />

                        <DropdownMenuItem onClick={() => handleDeactivate(material.id, material.is_active)} className="rounded-lg cursor-pointer text-red-950 focus:bg-red-50 focus:text-red-700 transition-colors">
                          {material.is_active ? (t('actions.deactivate') || 'إيقاف الصنف') : (t('actions.activate') || 'تفعيل الصنف')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* معلومات الصنف الأساسية */}
                  <div className="p-5 pt-2 flex-1">
                    <h3 className="text-lg font-medium text-primary truncate mb-2 group-hover:text-primary transition-colors" title={material.name}>
                      {material.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                        {material.sku}
                      </span>
                      {material.is_serialized && (
                        <span className="text-[10px] font-bold text-primary bg-secondary/10 px-2 py-1 rounded-md">
                          يتطلب سيريالات
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-5  border-t border-slate-100 space-y-4 mt-auto">
                    
                    <div>
                      <div className="flex  justify-between text-xs mb-2 font-medium">
                        <span className="text-slate-500">{t('card.stock') || 'الرصيد:'}</span>
                        <span className={isCritical ? 'text-red-900 font-bold' : 'text-primary font-bold'}>
                          {material.quantity} {material.unit || 'قطعة'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-red-900' : 'bg-primary'}`} 
                          style={{ width: `${stockPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* السعر والتكلفة */}
                    <div className='flex flex-col  gap-3 pt-3 border-t border-slate-200/50'>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-light text-primary">{t('card.cost') || 'سعر الشراء:'}</span>
                        <span className="font-medium text-primary">{material.current_cost} ج.م</span>
                      </div> 
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-light text-primary">{t('card.price') || 'سعر البيع:'}</span>
                        <span className="font-medium text-primary">{material.current_price} ج.م</span>
                      </div> 
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* المودالز */}
      <MaterialFormModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        materialToEdit={materialToEdit}
      />

      <AdjustInventoryModal 
        open={isAdjustInventoryOpen} 
        onOpenChange={setIsAdjustInventoryOpen} 
        material={materialToAdjust} 
      />

      <AddSerialModal
        open={isAddSerialOpen}
        onOpenChange={setIsAddSerialOpen}
        defaultMaterialId={materialToAddSerial}
      />

    </div>
     </div>
    
  );
}