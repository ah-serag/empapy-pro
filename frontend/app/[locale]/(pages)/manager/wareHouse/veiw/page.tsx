'use client';

import React, { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { 
  QrCode, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Home,
  Grid2X2,
  ArrowLeft,
  ArrowRight,
  Boxes,
  Package
} from 'lucide-react';

import { useGetExplorerLevelQuery } from '@/redux/features/viewWareHouse';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MaterialCard = ({ material, t }: { material: any, t: any }) => {
  const serialsList = material.serials || [];
  const isOutOfStock = Number(material.total_stock) === 0;

  return (
    <div className="bg-white border border-slate-100/80 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col h-full group overflow-hidden">
      
      {/* 1. رأس الكارت - فخم وبسيط في نفس الوقت */}
      <div className="flex flex-col bg-primary/10 p-5">
        <h4 className="font-bold text-primary text-base leading-snug tracking-tight group-hover:opacity-80 transition-opacity">
          {material.name}
        </h4>
        <span className="inline-block w-fit mt-2 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-50 text-slate-400 border border-slate-100">
          {material.sku}
        </span>
      </div>

      {/* 2. تفاصيل الكارت (مسافات منظمة جداً كأنها جدول) */}
      <div className="mt-auto flex flex-col gap-4 p-5">
        
        {/* صف التكلفة وسعر البيع */}
        <div className="flex flex-col gap-3">
          
          {/* التكلفة */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-widest">التكلفة:</span>
            <span className="font-semibold text-slate-500 text-[13px]">
              {material.current_cost} <span className="text-[13px] font-medium text-slate-400">{t('currency') || 'ج.م'}</span>
            </span>
          </div>
          
          {/* سعر البيع */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-slate-400 font-semibold uppercase tracking-widest">{t('price') || 'البيع:'}</span>
            <span className="font-bold text-slate-800 text-sm">
              {material.current_price} <span className="text-[10px] font-medium text-slate-400">{t('currency') || 'ج.م'}</span>
            </span>
          </div>
          
        </div>
        
        {/* خط فاصل خفيف جدًا لزيادة الترتيب */}
        <div className="h-px w-full bg-slate-50"></div>
        
        {/* قسم الرصيد */}
        <div className="flex items-center justify-between">
          <span className="text-[14px] text-slate-400 font-semibold uppercase tracking-widest">
            {t('stock') || 'الرصيد'}
          </span>
          <span className={cn("font-bold text-sm", isOutOfStock ? 'text-red-900' : 'text-emerald-800')}>
            {material.total_stock} <span className="text-[13px] font-medium ml-1 text-slate-400">{material.unit || t('unitPiece') || 'قطعة'}</span>
          </span>
        </div>
        
      </div>

      {/* 3. زر السيريالات (يظهر للأصناف المسريدة فقط) */}
      {material.is_serialized && (
        <div className="px-5 pb-5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full h-10 rounded-xl bg-secondary text-white transition-all duration-300 font-bold text-xs shadow-sm border-none hover:bg-secondary/90 hover:text-white", 
                  isOutOfStock && "opacity-50 cursor-not-allowed grayscale bg-gray-500 hover:bg-gray-500"
                )}
                disabled={isOutOfStock}
              >
                <QrCode className="w-3.5 h-3.5 mr-2" />
                {t('showSerials') || 'السيريالات'} ({serialsList.length})
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="center" className="w-[240px] rounded-xl border-slate-100 shadow-lg max-h-[250px] overflow-y-auto p-1.5">
              <DropdownMenuLabel className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-lg mb-1 flex items-center justify-between">
                {t('availableSerials') || 'السيريالات المتاحة'}
                <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 text-[10px] px-1.5 py-0">
                  {serialsList.length}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-50" />
              
              {serialsList.length > 0 ? (
                <div className="space-y-0.5 mt-1">
                  {serialsList.map((s: any) => (
                    <DropdownMenuItem key={s.id} className="font-mono text-xs font-medium text-slate-700 py-2.5 px-3 cursor-copy focus:bg-primary/5 focus:text-primary rounded-lg transition-colors">
                      {s.serial}
                    </DropdownMenuItem>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-[11px] text-slate-400 font-medium">
                  {t('noSerials') || 'لا توجد سيريالات متاحة'}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. المكون الرئيسي (Inventory Explorer Page)
// ============================================================================
export default function InventoryExplorer() {
  const t = useTranslations('Warehouse.Explorer');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategoryId = searchParams.get('categoryId');

  const createQueryString = useCallback((name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(name, value);
      else params.delete(name);
      return params.toString();
    }, [searchParams]
  );

  const navigateToCategory = (id?: string) => {
    router.push(pathname + '?' + createQueryString('categoryId', id || ''));
  };

  const navigateBack = () => {
    router.back();
  };

  const { data, isLoading, isError } = useGetExplorerLevelQuery(currentCategoryId);

  const subCategories = data?.data?.subCategories || [];
  const materials = data?.data?.materials || [];
  const breadcrumbs = data?.data?.breadcrumbs || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[500px] w-full max-w-7xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm mt-6">
        <Loader2 className="w-8 h-8 animate-spin text-primary/30 mb-4" />
        <p className="text-sm text-slate-400 font-medium">{t('loadingStructure') || 'جاري تحميل البيانات...'}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 mt-6 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-center text-sm font-bold max-w-xl mx-auto shadow-sm">
        {t('loadError') || 'حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.'}
      </div>
    );
  }

  return (
    <div className="p-4  w-full max-w-9xl mx-auto space-y-5">
      
      <div className="flex items-center flex-wrap gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-md rounded-xl border border-slate-100 shadow-sm">
        <button 
          onClick={() => navigateToCategory()}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all",
            !currentCategoryId 
              ? "font-bold bg-primary/5 text-primary" 
              : "font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-800"
          )}
        >
          <Home className="w-3.5 h-3.5" />
          {t('mainStore') || 'المستودع الرئيسي'}
        </button>

        {breadcrumbs.map((crumb: any, index: number) => {
          const isLast = index === breadcrumbs.length - 1;
          const Icon = isRTL ? ChevronLeft : ChevronRight;
          
          return (
            <React.Fragment key={crumb.id}>
              <Icon className="w-3.5 h-3.5 text-slate-300" strokeWidth={2.5} />
              <button
                onClick={() => !isLast && navigateToCategory(crumb.id.toString())}
                disabled={isLast}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs transition-all",
                  isLast 
                    ? "font-bold bg-primary/5 text-primary cursor-default" 
                    : "font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                )}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* الشاشة الرئيسية للمحتوى */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 min-h-[500px]">
        
        {/* رأس المحتوى وزر الرجوع */}
        <div className="flex items-center justify-between shadow-lg rounded-2xl  p-5 mb-5 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50  flex items-center rounded-2xl justify-center shadow-xl p-2 border border-slate-100/50">
              <Grid2X2 className="w-6 h-6 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary tracking-tight">
                {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : (t('title') || 'تصفح المخزون')}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {subCategories.length} {t('folders') || 'أقسام'} • {materials.length} {t('items') || 'أصناف'}
              </p>
            </div>
          </div>

          {currentCategoryId && (
            <Button 
              onClick={navigateBack} 
              variant="ghost" 
              className=" text-slate-400  shadow-lg rounded-2xl     hover:bg-slate-50 hover:text-slate-700 h-10 px-5 flex items-center gap-2 text-xs font-bold transition-all"
            >
              {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
              {t('back') || 'رجوع'}
            </Button>
          )}
        </div>
        
        {/* قسم الأقسام */}
        {subCategories.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('subCategories') || 'الأقسام'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subCategories.map((cat: any) => (
                <button 
                  key={cat.id} 
                  onClick={() => navigateToCategory(cat.id.toString())}
                  className="w-full p-4 py-10 bg-primary/5 hover:border-primary/20 shadow-md hover:shadow-md rounded-2xl flex items-center gap-3.5 transition-all duration-300 text-right group"
                >
                  <div className="w-10 h-10 rounded-xl  bg-white flex items-center justify-center transition-colors">
                    <Boxes className="text-primary transition-colors shrink-0" size={20} strokeWidth={1.5} />
                  </div>
                  <span className="font-bold text-primary transition-colors text-sm truncate">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* قسم الأصناف */}
        {materials.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('availableItems') || 'الأصناف المتاحة'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {materials.map((mat: any) => (
                <MaterialCard key={mat.id} material={mat} t={t} />
              ))}
            </div>
          </div>
        )}

        {/* شاشة فارغة هادئة جداً */}
        {subCategories.length === 0 && materials.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-5 border border-slate-100">
              <Package className="w-8 h-8 text-slate-300" strokeWidth={1} />
            </div>
            <h3 className="text-lg font-bold text-slate-600 mb-2">{t('emptySection') || 'لا توجد بيانات'}</h3>
            <p className="text-sm font-medium text-slate-400 max-w-sm">
              {t('emptySectionDesc') || 'هذا القسم فارغ حالياً من الأقسام الفرعية والأصناف.'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}