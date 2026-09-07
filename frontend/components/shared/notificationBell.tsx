"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Bell } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useGetUnreadNotificationsQuery } from "@/redux/features/notificationApiSlice";
import { Skeleton } from "../ui/skeleton";
import { useDispatch } from "react-redux";
import { apiSlice } from "@/redux/app/api/apiSlice"; 

export function NotificationBell() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { data: notificationData, refetch, isLoading } = useGetUnreadNotificationsQuery(undefined);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (notificationData?.success) {
      setUnreadCount(notificationData.count);
    }
  }, [notificationData]);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL as string);

    socket.emit("join:manager_room");

    socket.on("notification:new_booking", (incomingData) => {
      


      toast.message("New Booking Received", {
        action: {
          label: "View",
          onClick: () => router.push("/manager/notifications"),
        },
        duration: 5000,
      });

      setUnreadCount((prev) => prev + 1);

      refetch();
    
      dispatch(apiSlice.util.invalidateTags(["Booking"] as any));  
      dispatch(apiSlice.util.invalidateTags(["Notifications"] as any));  

      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(e => console.log("Audio playback requires user interaction"));
    });

    return () => {
      socket.disconnect();
    };
  }, [router, refetch, dispatch]);








  
  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    );
  }
  
  return (
    <div 
      onClick={() => router.push("/manager/notifications")} 
      className="relative p-2 cursor-pointer text-white hover:scale-105 transition-all rounded-full"
    >
      <Bell size={20} />
      
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-green-400 text-white text-[10px] p-2 font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm animate-pulse">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );
}