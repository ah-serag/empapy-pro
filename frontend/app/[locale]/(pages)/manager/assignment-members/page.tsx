"use client"

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Users, Phone, Calendar, Loader2, AlertCircle, Inbox, UserCircle } from 'lucide-react';
import { useGetAssignmentsMembersQuery } from '@/redux/features/assignmentsApiSlice'; 
import CopyButton from '@/components/shared/copyButton';

export default function BookingTeamSearchPage() {
  const t = useTranslations("BookingMembers");
  
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const { 
    data: response, 
    isFetching, 
    isError 
  } = useGetAssignmentsMembersQuery(activeSearch, {
    skip: !activeSearch 
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveSearch(searchInput.trim());
    }
  };

  const members = response?.data || [];

  return (
    <div className="min-h-screen w-full bg-gray-50/50 pb-12" dir="rtl">
      
      {/* Header & Search Bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary mb-4 shadow-sm">
              <Users size={32} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("pageTitle")}</h1>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed">
              {t("pageSubtitle")}
            </p>
          </div>

          {/* Search Form الأنيق */}
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto flex items-center">
            <Search className="absolute right-4 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder={t("searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-14 pl-28 pr-12 rounded-2xl border border-gray-200 bg-gray-50/50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium placeholder:text-gray-400 shadow-sm"
              dir="ltr" // جعلناه ltr ليكتب الرقم الإنجليزي بسهولة EMP-2026...
            />
            <button 
              type="submit"
              disabled={isFetching || !searchInput.trim()}
              className="absolute left-2 h-10 px-6 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center min-w-[80px]"
            >
              {isFetching ? <Loader2 size={16} className="animate-spin" /> : t("searchBtn")}
            </button>
          </form>

        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-3xl mx-auto px-4 mt-8">
        
        {/* حالة البداية: لم يبحث بعد */}
        {!activeSearch && !isFetching && (
          <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
            <Search size={48} className="text-gray-300 mb-4" strokeWidth={1} />
            <p className="text-gray-500 font-medium">{t("emptySearchState")}</p>
          </div>
        )}

        {/* حالة الخطأ */}
        {isError && !isFetching && (
          <div className="bg-white p-8 rounded-3xl border border-red-100 flex flex-col items-center text-center gap-4 shadow-sm">
            <div className="p-4 bg-red-50 rounded-full text-red-500">
              <AlertCircle size={32} />
            </div>
            <p className="text-gray-600 font-medium">{t("error")}</p>
          </div>
        )}

        {/* حالة لا توجد نتائج */}
        {!isError && activeSearch && !isFetching && members.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 flex flex-col items-center text-center gap-4 shadow-sm">
            <div className="p-4 bg-gray-50 rounded-full text-gray-400">
              <Inbox size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-gray-800 font-bold">{t("noResults")}</h3>
          </div>
        )}

        {/* حالة النجاح (عرض الكروت) */}
        {!isError && members.length > 0 && !isFetching && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {members.map((worker: any) => (
              <div 
                key={worker.assignment_member_id}
                className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-primary/20 shadow-md transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full  flex items-center justify-center  bg-primary text-white transition-colors">
                    <UserCircle size={28} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-1">{worker.worker_name}</h3>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                      <Phone size={14} className="text-gray-400" />
                      <span dir="ltr">{worker.phone || "غير متوفر"}
                        
                      </span>
                      <CopyButton textToCopy={worker.phone }/>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1.5">
                      <Calendar size={14} className="text-gray-400" />
                      <span>
                        {new Date(worker.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}