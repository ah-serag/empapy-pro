"use client"
import React from 'react';
import { RefreshCcw } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh: () => void;
  isFetching: boolean;
  variant?: 'icon' | 'text'; 
}

export default function RefreshButton({ onRefresh, isFetching, variant = 'icon' }: RefreshButtonProps) {
  
  if (variant === 'text') {
    return (
      <button 
        onClick={onRefresh}
        disabled={isFetching}
        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary/10 text-primary text-sm font-medium rounded-xl hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
      >
        <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
        {isFetching ? "جاري التحديث..." : "تحديث البيانات"}
      </button>
    );
  }

  return (
    <button 
      onClick={onRefresh}
      disabled={isFetching}
      title="تحديث"
      className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-full transition-all active:scale-90 disabled:opacity-50 flex items-center justify-center"
    >
      <RefreshCcw size={18} className={isFetching ? "animate-spin" : ""} />
    </button>
  );
}