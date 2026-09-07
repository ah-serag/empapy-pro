"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import TeamNotificationLink from "./TeamNotificationLink"; 
import AccountInfo from "../shared/accountInfo";
import TeamRejectedNotificationLink from "./TeamRejectedNotificationLink";

export default function TeamNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-primary shadow-md border-b border-white/10">
      <div className="max-w-screen-xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
        
        <div className="shrink-0 flex items-center">
          <AccountInfo />
        </div>

        <div className="flex items-center gap-3 bg-white/10 p-1 rounded-2xl backdrop-blur-sm border border-white/5 shadow-inner">
          
          <TeamNotificationLink 
            href="/team" 
            icon={Briefcase}
            title="المهام الميدانية"
          />

          <TeamRejectedNotificationLink 
           href="/team/rejectedAss" 
          icon={AlertTriangle}
         title="المهام المرفوضة"
         />

        </div>

  

      </div>
    </header>
  );
}