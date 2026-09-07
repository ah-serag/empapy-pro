"use client"
import Authorization from "@/components/auth/Authorization";
import { cn } from "@/lib/utils";
import { playfairDisplayHeading, tajawal } from "../../fonts";
import TeamNavbar from "@/components/Team/navbarTeam";

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const activeFont = tajawal.variable;
  
  return (
    <div dir="rtl" className={
        cn(
           "font-sans h-screen flex flex-col overflow-hidden bg-slate-50",
          activeFont,
           playfairDisplayHeading.variable
        )
    }>
      <TeamNavbar/>
     
      <div className="flex-1 overflow-y-hidden overflow-x-hidden">
        <main className="container mx-auto pb-6 pt-0">
          <Authorization allow={["supervisor"]}>
            {children}
          </Authorization>
        </main>
      </div>

    </div>
  );
}