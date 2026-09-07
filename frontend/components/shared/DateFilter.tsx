'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear 
} from 'date-fns';
import { Calendar as CalendarIcon, Filter } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';

export default function DateFilter() {
  const t = useTranslations("dashboard.filter");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentFilter = searchParams.get('filter') || 'all';
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: searchParams.get('startDate') ? new Date(searchParams.get('startDate') as string) : undefined,
    to: searchParams.get('endDate') ? new Date(searchParams.get('endDate') as string) : undefined,
  });
 
  const updateUrlParams = (filterType: string, from?: Date, to?: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    
    params.set('filter', filterType);

    if (from && to && filterType !== 'all') {
      // تنسيق التاريخ ليكون مقبولاً في قاعدة البيانات SQL
      params.set('startDate', format(from, 'yyyy-MM-dd'));
      params.set('endDate', format(to, 'yyyy-MM-dd'));
    } else {
      params.delete('startDate');
      params.delete('endDate');
    }

    // تحديث الرابط بدون إعادة تحميل الصفحة
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSelectChange = (value: string) => {

    const now = new Date();
    
    switch (value) {
      case 'all':
        updateUrlParams('all');
        break;
      case 'today':
        updateUrlParams('today', startOfDay(now), endOfDay(now));
        break;
      case 'week':
        updateUrlParams('week', startOfWeek(now, { weekStartsOn: 6 }), endOfWeek(now, { weekStartsOn: 6 })); // يبدأ الأسبوع السبت
        break;
      case 'month':
        updateUrlParams('month', startOfMonth(now), endOfMonth(now));
        break;
      case 'year':
        updateUrlParams('year', startOfYear(now), endOfYear(now));
        break;
      case 'custom':
      
        const params = new URLSearchParams(searchParams.toString());
        params.set('filter', 'custom');
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        break;
    }
  };

  const applyCustomDate = () => {
    if (date?.from && date?.to) {
      updateUrlParams('custom', date.from, date.to);
    }
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl px-5 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full mb-4">
      
      {/* القسم الأيمن: عنوان الفلتر والقائمة المنسدلة */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="flex items-center gap-2 text-sky-900">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">{t('label')}</span>
        </div>
        
        <Select value={currentFilter} onValueChange={handleSelectChange}>
          <SelectTrigger className="w-[180px] px-2 bg-slate-50 border-slate-200 rounded-lg focus:ring-0 focus:ring-offset-0 transition-colors hover:bg-slate-100 text-slate-800">
            <SelectValue placeholder={t('presets.all')} />
          </SelectTrigger>
          <SelectContent className="rounded-lg mt-10 border-slate-200 shadow-md">
            <SelectItem value="all" className="rounded-md cursor-pointer">{t('presets.all')}</SelectItem>
            <SelectItem value="today" className="rounded-md cursor-pointer">{t('presets.today')}</SelectItem>
            <SelectItem value="week" className="rounded-md cursor-pointer">{t('presets.week')}</SelectItem>
            <SelectItem value="month" className="rounded-md cursor-pointer">{t('presets.month')}</SelectItem>
            <SelectItem value="year" className="rounded-md cursor-pointer">{t('presets.year')}</SelectItem>
            <SelectItem value="custom" className="rounded-md cursor-pointer text-primary">{t('presets.custom')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* القسم الأيسر: يظهر فقط إذا تم اختيار "فترة مخصصة" */}
      {currentFilter === 'custom' && (
        <div className="w-full sm:w-auto flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  " w-fit md:w-[260px] justify-start text-left font-normal  rounded-lg bg-gray-100 border-slate-200 hover:bg-slate-50 text-primary",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4  text-primary" />


                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>{t('pick_date')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-lg border-slate-200 shadow-lg overflow-hidden" align="end">
              <Calendar
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={1}
                className="rounded-lg bg-white p-3   "
                classNames={{
                  selected : "bg-sky-600 rounded-lg text-primary-foreground hover:bg-sky-600 hover:text-primary-foreground focus:text-primary-foreground rounded-lg",
                  today: "bg-gray-500 text-accent-foreground rounded-lg",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-lg",
                }}
              />
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                <Button 
                  onClick={applyCustomDate}
                  disabled={!date?.from || !date?.to}
                  className="rounded-lg bg-primary hover:bg-primary/80 text-white px-8"
                >
                  {t('apply')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

    </div>
  );
}