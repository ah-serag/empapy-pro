'use client';

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2, Loader2, Folder, FolderOpen, AlertCircle, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  children?: Category[]; 
}

interface CategoriesDisplayProps {
  categories: Category[];
  isLoading: boolean;
  isDeleting: boolean;
  onDelete: (id: number) => void;
}


const buildCategoryTree = (flatCategories: Category[]): Category[] => {
  const tree: Category[] = [];
  const map: Record<number, Category> = {};

  flatCategories.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });

  flatCategories.forEach((cat) => {
    if (cat.parent_id && map[cat.parent_id]) {
      map[cat.parent_id].children?.push(map[cat.id]);
    } else {
      tree.push(map[cat.id]);
    }
  });

  return tree;
};


const CategoryNode = ({
  category,
  level = 0,
  isDeleting,
  onDelete,
}: {
  category: Category;
  level?: number;
  isDeleting: boolean;
  onDelete: (id: number) => void;
}) => {
  const hasChildren = category.children && category.children.length > 0;
  const [isExpanded, setIsExpanded] = useState(level === 0);

  return (
    <div className="flex flex-col">
      <div 
        className={`
          group flex items-center justify-between p-3 rounded-xl transition-colors
          ${level === 0 ? 'bg-slate-50/80 mb-2' : 'hover:bg-slate-50/50 mt-1'}
        `}
      >
        <div className="flex items-center gap-3">
          {/* زر التوسيع / الطي (يظهر فقط إذا كان لديه أبناء) */}
          <div className="w-6 flex justify-center">
            {hasChildren ? (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded-md text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-4 h-4" /> 
            )}
          </div>
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => hasChildren && setIsExpanded(!isExpanded)}>
            {level === 0 ? (
              <FolderOpen className="w-5 h-5 text-primary/70" />
            ) : (
              <Folder className="w-4 h-4 text-slate-400" />
            )}
            <span className={`font-medium ${level === 0 ? 'text-slate-800 text-sm' : 'text-slate-600 text-sm'}`}>
              {category.name}
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md ml-2">
              #{category.id}
            </span>
          </div>
        </div>

        {/* زر الحذف */}
        <Button
          variant="ghost"
          size="icon"
          disabled={isDeleting}
          onClick={() => onDelete(category.id)}
          className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-none"
          title="حذف القسم"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* رسم الأبناء إن وجدوا (باستدعاء نفس المكون) */}
      {hasChildren && isExpanded && (
        <div className="ml-6 pl-4 border-l-2 border-slate-100/80 my-1 flex flex-col gap-1">
          {category.children!.map((child) => (
            <CategoryNode 
              key={child.id} 
              category={child} 
              level={level + 1} 
              isDeleting={isDeleting} 
              onDelete={onDelete} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function CategoriesDisplay({ categories, isLoading, isDeleting, onDelete }: CategoriesDisplayProps) {
  const t = useTranslations('Warehouse.Categories');

  // تحويل القائمة المسطحة إلى شجرة
  const categoryTree = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return buildCategoryTree(categories);
  }, [categories]);

  // حالات التحميل
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200/60 rounded-2xl p-16 flex flex-col items-center justify-center shadow-sm w-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50 mb-4" />
        <p className="text-slate-500 font-light text-sm">جاري تحميل هيكل الأقسام...</p>
      </div>
    );
  }

  // حالة عدم وجود بيانات
  if (categories.length === 0) {
    return (
      <div className="bg-white border border-slate-200/60 rounded-2xl p-16 flex flex-col items-center justify-center shadow-sm w-full">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-500 font-medium text-sm">{t('noData') || 'لا توجد أقسام مسجلة حتى الآن.'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm w-full flex flex-col gap-2">
      {categoryTree.map((mainCategory) => (
        <CategoryNode 
          key={mainCategory.id} 
          category={mainCategory} 
          isDeleting={isDeleting} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
}