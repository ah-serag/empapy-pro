"use client";

import { useRouter } from "@/i18n/navigation";
import { apiSlice } from "@/redux/app/api/apiSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { toast } from "sonner";


export default function ManagerSocketListener({ setUnreadCount, refetch }: any) {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL as string);

    socket.emit("join:manager_room");

    socket.on("notification:needs_review", (data) => {
      toast.message(data.title || "مراجعة مطلوبة ", {
        description: data.message || `مهمة رقم ${data.booking_ref} تنتظر المراجعة.`,
        action: { 
          label: "مراجعة الآن", 
          onClick: () => router.push("/manager/job")
        }, 
        duration: 8000,
      });
      
      if(setUnreadCount) setUnreadCount((prev: number) => prev + 1);
      
      dispatch(apiSlice.util.invalidateTags(["JobExecutions", "Assignments", "Notifications"] as any)); 
      
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(e => console.log("Audio required interaction"));
      } catch(err) {}
    });

    return () => {
      socket.disconnect();
    };
  }, [router, refetch, dispatch, setUnreadCount]);

  return null;
}