import React from "react";
import { LogOut, Settings, User, Phone, Clock } from "lucide-react"; 
import { useGetUserAccountInfoQuery } from "../../redux/features/account"; 
import { useLogOutMutation } from "@/redux/features/authApiSlice";
import { useRouter } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelector } from "react-redux";

const AccountInfo = () => {
  const router = useRouter();
  const user = useSelector((state : any) => state.auth.user);

  const [logout, { isLoading: isLoggingOut }] = useLogOutMutation();

  const handleLogout = async () => {
    try {
      await logout(undefined).unwrap(); 
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  if (!user) return null;

  return (
    <div className="flex items-center inset-0 z-[100] gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* تم ضبط الـ Hover ليقوم بتكبير الأيقونة قليلاً مع الحفاظ على تناسق الألوان */}
          <Avatar className="cursor-pointer z-[100] transition-transform duration-200 hover:scale-105 ring-2 ring-transparent hover:ring-white/20">
            {/* رجعت الخلفية بيضاء والنص بلون الـ Primary وتم ضبط الـ Hover */}
            <AvatarFallback className="bg-white z-[100] text-primary hover:bg-slate-100 hover:text-primary transition-colors font-semibold">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        
        {/* قائمة الخيارات المنسدلة: تصميم أنيق، خلفية بيضاء، حواف ناعمة */}
        <DropdownMenuContent align="end" className="w-64 bg-white text-slate-800 p-1 m-2 mt-7 rounded-xl shadow-lg border border-slate-100">
          <DropdownMenuLabel className="font-normal p-3">
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-start">
                <p className="text-sm font-semibold text-primary truncate">{user.full_name}</p>
                {user.role && (
                  <span className="px-2 py-0.5 text-[10px] bg-primary/10 text-primary font-medium rounded-full uppercase tracking-wider">
                    {user.role}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
              
              <div className="flex flex-col space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {user.phone}
                  </div>
                )}
                {user.last_login_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {formatDate(user.last_login_at)}
                  </div>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator className="bg-slate-100 my-1" />
          

          
          <DropdownMenuSeparator className="bg-slate-100 my-1" />
          
          <DropdownMenuItem 
            onClick={handleLogout} 
            disabled={isLoggingOut} 
            className="cursor-pointer gap-2 mx-1 mb-1 rounded-md text-red-500 focus:bg-red-50 focus:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" /> {isLoggingOut ? "Logging out..." : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AccountInfo;