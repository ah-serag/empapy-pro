"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { apiSlice } from "@/redux/app/api/apiSlice";
import { RootState } from "@reduxjs/toolkit/query";

interface TeamRejectedNotificationLinkProps {
  href: string;
  icon: React.ElementType; 
  title?: string; 
}

export default function TeamRejectedNotificationLink({ href, icon: Icon , title }: TeamRejectedNotificationLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const [hasNewNotification, setHasNewNotification] = useState(false);

  const user = useSelector((state: any) => state.auth.user);
  const teamId = user?.team_id; 

  const isActive = pathname === href;

  useEffect(() => {
    if (isActive) {
      setHasNewNotification(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (!teamId) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL as string);

    socket.emit("join:team_room", teamId);

    socket.on("notification:execution_rejected", (data) => {
      setHasNewNotification(true);

      toast.message(data.title || "مهمة مرفوضة ", {
        description: data.message || "تم رفض مهمة وإعادتها للتعديل.",
        action: {
          label: "عرض",
          onClick: () => {
             setHasNewNotification(false);
             router.push(href); 
          },
        },
        duration: 10000, 
      });

      dispatch(apiSlice.util.invalidateTags(["Assignments", "JobExecutions"] as any));

      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(e => console.log("Audio blocked by browser"));
      } catch (err) {}
    });

    return () => {
      socket.disconnect();
    };
  }, [router, dispatch, teamId, href]);

  return (
    <Link 
      href={href}
      title={title} 
      className={cn(
        "relative flex items-center justify-center w-15 h-7 rounded-xl transition-all duration-300",
        isActive 
          ? "bg-white text-primary shadow-sm" 
          : "text-white/80 hover:bg-white/20 hover:text-white"
      )}
    >
      <Icon size={18} className={cn(isActive ? "text-primary" : "text-white/80")} />

      {hasNewNotification && !isActive && (
        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-sm border border-white/20"></span>
        </span>
      )}
    </Link>
  );
}