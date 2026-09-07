import Authorization from "@/components/auth/Authorization";
import { NavbarManager } from "@/components/manager/navbar-manger";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { notoSans, playfairDisplayHeading, tajawal } from "../../fonts";
import ManagerSocketListener from "@/components/manager/ManagerSocketListener";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ManageLayout({ children, params }: Props) {
  const { locale } = await params;
  const isRTL = locale === "ar";
  
  const activeFont = isRTL ? tajawal.variable : notoSans.variable;

  return (
<div 
      dir={isRTL ? "rtl" : "ltr"} 
      className={cn(
      "h-[100dvh] w-full overflow-hidden font-sans flex flex-col xl:flex-row bg-[#F8FAFC]",        activeFont, 
        playfairDisplayHeading.variable
      )}
    >
      <ManagerSocketListener />
      
      <NavbarManager />
       
      <main className="flex-1 w-full min-w-0 shadow-sm relative flex flex-col overflow-hidden">
        <ScrollArea 
          className="h-full w-full" 
          dir={isRTL ? "rtl" : "ltr"}
        >
          <Authorization allow={["superadmin", "admin"]}>
            {children}
          </Authorization>
        </ScrollArea>
      </main>
    </div>
  );

}