"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Home, Headset, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/shared/langSwitch";

export default function UnauthorizedPage() {
  const t = useTranslations("Unauthorized");
  const router = useRouter();


  return (
    <div
      className="min-h-screen  bg-white flex flex-col items-center justify-center p-4 relative transition-colors duration-300 font-sans overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 dark:bg-red-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      

      <div className="absolute bg-sky-800 rounded-xl top-6 end-6 z-10">
      <LanguageSwitcher/>
      </div>

      <div className="relative z-10 max-w-lg w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 p-10 sm:p-14 rounded-[1rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)] text-center transition-all duration-300">
        
        {/* الأيقونة بحجم أكبر وتأثير متدرج */}
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-sky-100 to-sky-50  rounded-full flex items-center justify-center mb-8 shadow-inner border border-red-200/50 dark:border-red-800/30">
          <ShieldAlert className="w-12 h-12 text-sky-700 drop-shadow-sm" strokeWidth={1.5} />
        </div>

        {/* العناوين والنصوص */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-sky-900 dark:text-white mb-4">
          {t("title")}
        </h1>
        
        <p className="text-lg text-sky-800  mb-6 leading-relaxed font-medium">
          {t("description")}
        </p>
        
        <p className="text-sm text-sky-800  mb-10 leading-relaxed">
          {t("suggestion")}
        </p>

       <div className="w-full  rounded-xl">
     <Button className="bg-sky-800 rounded-xl " onClick={()=>  router.push("/auth/login")}>
       sign in
      </Button>
       </div>
      </div>
    </div>
  );
}