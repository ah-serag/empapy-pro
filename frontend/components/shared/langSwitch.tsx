"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Globe } from "lucide-react";
import { useParams } from "next/navigation";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  
  const currentLocale = (params.locale as string) || "en";
  
  const targetLocale = currentLocale === "en" ? "ar" : "en";
  
  const displayLabel = currentLocale === "en" ? "AR" : "EN";

  const handleLanguageToggle = () => {
    const search = window.location.search;
    router.replace(`${pathname}${search}`, { locale: targetLocale });
  };

  return (
    <button
      type="button" 
      onClick={handleLanguageToggle}
      className="flex items-center  text-white  gap-2 px-3 py-1.5 rounded-full transition-all duration-300 hover:bg-primary/10 active:scale-95 group "
    >
      <span className="text-sm font-medium tracking-wide">
        {displayLabel}
      </span>
    </button>
  );
}