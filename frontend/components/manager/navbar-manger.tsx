"use client"

import React, { useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

import { 
  Bell, Map, Users, Calendar, Receipt, Menu, X, 
  ChevronDown, ClipboardList, LayoutDashboard, Package, 
  PanelLeftClose, PanelRightClose,
  Briefcase,
  Landmark,
  ShoppingCart,
  Wallet,
  Sheet
} from "lucide-react"

import AccountInfo from "../shared/accountInfo"
import { NotificationBell } from "../shared/notificationBell"
import LanguageSwitcher from "../shared/langSwitch"
import { ScrollArea } from "@/components/ui/scroll-area"

export function NavbarManager() {
  const t = useTranslations("NavbarManager")
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const pathname = usePathname() || "" 
  
  const [isCollapsed, setIsCollapsed] = useState(false) 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

  const navData = [ 
    { title: t("nav.dashboard.title"), icon: LayoutDashboard, href: "/manager/" },

    {
      title: t("nav.coreData.title"), icon: Map,
      items: [
        { title: t("nav.coreData.items.locations.title"), href: "/manager/locations" },
        { title: t("nav.coreData.items.serviceCategories.title"), href: "/manager/service-categories" },
      ],
    },
    {
      title: t("nav.treasury.title"), 
      icon: Landmark,
      items: [
        { title: t("nav.treasury.items.safes.title"), href: "/manager/treasury/safes" },
        { title: t("nav.treasury.items.accounts.title"), href: "/manager/treasury/accounts" },
        { title: t("nav.treasury.items.transactions.title"), href: "/manager/treasury/transactions" },
        { title: t("nav.treasury.items.expenses.title"), href: "/manager/treasury/expenses" },
        { title: t("nav.treasury.items.collections.title"), href: "/manager/treasury/collections" },
        { title: t("nav.treasury.items.vouchers_list.title"), href: "/manager/treasury/VouchersList" },
        { title: t("nav.treasury.items.create_voucher.title"), href: "/manager/treasury/create_vouchers" },
        { title: t("nav.treasury.items.advances.title"), href: "/manager/treasury/advances" },
      ],
    },
    {
      title: t("nav.teamUsers.title"), icon: Users,
      items: [
        { title: t("nav.teamUsers.items.users.title"), href: "/manager/team_users/users" },
        { title: t("nav.teamUsers.items.teams.title"), href: "/manager/team_users/teams" },
        { title: t("nav.teamUsers.items.createAccount.title"), href: "/manager/team_users/create_account" },
      ]
    },
    {
      title: t("nav.warehouse.title"), icon: Package,
      items: [
        { title: t("nav.warehouse.items.categories.title"), href: "/manager/wareHouse/material-category" },
        { title: t("nav.warehouse.items.materials.title"), href: "/manager/wareHouse/materials" },
        { title: t("nav.warehouse.items.search.title"), href: "/manager/wareHouse/veiw" } ,
        { title: t("nav.warehouse.items.transactions.title"), href: "/manager/wareHouse/transactions" }
      ]
    },
    {
      title: t("nav.purchases.title"), 
      icon: ShoppingCart, 
      items: [
        { title: t("nav.purchases.items.suppliers.title"), href: "/manager/suppliers" }, 
        { title: t("nav.purchases.items.invoices.title"), href: "/manager/purchases/invoices" }, 
        { title: t("nav.purchases.items.new_invoice.title"), href: "/manager/purchases/new" },
        { title: t("nav.purchases.items.supplier_transactions.title"), href: "/manager/purchases/transactions" } 
      ]
    },
    {
      title: t("nav.finance.title"), 
      icon: Wallet,
      items: [
        { title: t("nav.finance.items.technicianProfiles.title"), href: "/manager/finance/technician-profiles" },
        { title: t("nav.finance.items.technicianEarnings.title"), href: "/manager/finance/TechnicianEarnings" },
        { title: t("nav.finance.items.technicianSettlement.title"), href: "/manager/finance/TechnicianSettlement" },
        { title: t("nav.finance.items.settlementsHistory.title"), href: "/manager/finance/SettlementsHistory" },
      ],
    },
    { title: t("nav.bookings.title"), icon: Calendar, href: "/manager/bookings" },
    { title: t("nav.notifications.title"), icon: Bell, href: "/manager/notifications" },
    { title: t("nav.assignments.title"), icon: ClipboardList , href: "/manager/assignments" },
    { title: t("nav.invoices.title"), icon: Receipt, href: "/manager/invoices" },
    { title: t("nav.job.title"), icon: Briefcase, href: "/manager/job" },
    { title: t("nav.create-file.title"), icon: Sheet, href: "/manager/document-generator" }
  ]

  const toggleSubmenu = (title: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenSubmenu(openSubmenu === title ? null : title)
  }

  const isPathActive = (href: string) => {
    if (!href) return false;
    const cleanHref = href.endsWith('/') ? href.slice(0, -1) : href;
    if (cleanHref === '/manager') {
      return pathname === '/manager' || pathname === '/ar/manager' || pathname === '/en/manager' || pathname === '/manager/' || pathname === '/ar/manager/' || pathname === '/en/manager/';
    }
    return pathname.includes(cleanHref);
  };

  const NavItem = ({ section, isMobile = false }: { section: any, isMobile?: boolean }) => {
    const Icon = section.icon
    const isOpen = openSubmenu === section.title
    const collapsed = !isMobile && isCollapsed 

    if (section.href) {
      return (
        <Link 
          href={section.href} 
          onClick={() => setIsMobileMenuOpen(false)}
          className={cn(
            "flex items-center transition-all duration-300 group overflow-hidden whitespace-nowrap hover:bg-white/10 hover:text-white",
            collapsed ? "w-10 h-10 mx-auto justify-center rounded-xl px-0 mb-1" : "gap-2.5 px-3 py-2 rounded-xl w-full mb-0.5",
            isPathActive(section.href) ? "bg-white/10 text-white" : "text-white/70" 
          )}
          title={collapsed ? section.title : undefined}
        >
          <Icon className="w-[18px] h-[18px] flex-shrink-0 transition-transform duration-300 group-hover:scale-110" strokeWidth={collapsed ? 2.5 : 2} />
          <span className={cn("text-[12px] font-medium tracking-wide transition-all duration-300", collapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
            {section.title}
          </span>
        </Link>
      )
    }

    return (
      <div className="flex flex-col mb-0.5">
        <button 
          onClick={() => toggleSubmenu(section.title)}
          className={cn(
            "flex items-center transition-all duration-300 group overflow-hidden whitespace-nowrap hover:bg-white/10 hover:text-white",
            isOpen && !collapsed ? "text-white bg-white/10" : "text-white/70",
            collapsed ? "w-10 h-10 mx-auto justify-center rounded-xl px-0 mb-1" : "justify-between gap-2.5 px-3 py-2 rounded-xl w-full"
          )}
          title={collapsed ? section.title : undefined}
        >
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <Icon className="w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110" strokeWidth={collapsed ? 2.5 : 2} />
            <span className={cn("text-[12px] font-medium tracking-wide transition-all duration-300", collapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
              {section.title}
            </span>
          </div>
          {!collapsed && (
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300 flex-shrink-0", isOpen ? "rotate-180 text-white" : "opacity-60 group-hover:opacity-100")} />
          )}
        </button>

        <div className={cn("grid transition-all duration-300 ease-in-out", isOpen && !collapsed ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
          <div className="overflow-hidden">
            <div className={cn("flex flex-col gap-0.5 py-1", isRTL ? "pr-9 border-r border-white/10 mr-4" : "pl-9 border-l border-white/10 ml-4")}>
              {section.items?.map((item: any, i: number) => (
                <Link
                  key={i}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "text-[11.5px] font-medium hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap",
                    isPathActive(item.href) ? "bg-white/10 text-white" : "text-white/50"
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ===================== Mobile / Tablet Header ===================== */}
      <header className="flex xl:hidden h-14 items-center justify-between bg-primary px-4 sticky top-0 z-50 w-full shadow-sm border-b border-white/5 shrink-0">
        <div className="gap-3 flex flex-row items-center"> 
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-white/70 hover:text-white transition-colors ml-1">
            <Menu size={22} />
          </button>
     
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <NotificationBell />
        </div>
      </header>

      {/* ===================== Mobile Menu Overlay ===================== */}
      {isMobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-[50] flex" dir={isRTL ? "rtl" : "ltr"}>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          
          <div className={cn("relative w-[280px] bg-primary h-full flex flex-col shadow-2xl transition-transform", isRTL ? "ml-auto" : "mr-auto")}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <span className="font-bold text-lg text-white tracking-wide">{t("managerPanel")}</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/50 hover:text-white bg-white/5 p-1.5 rounded-full hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            {/* Scrollable Nav Area */}
            <ScrollArea className="flex-1 w-full min-h-0" dir={isRTL ? "rtl" : "ltr"}>
              <div className="p-3">
                {navData.map((section, idx) => <NavItem key={idx} section={section} isMobile={true} />)}
              </div>
            </ScrollArea>

            {/* Fixed Footer */}
            <div className="p-4 border-t z-[100] border-white/10 bg-black/10 shrink-0 mt-auto">
              <AccountInfo />
            </div>
          </div>
        </div>
      )}

      {/* ===================== Desktop Sidebar ===================== */}
      {/* 
      
      */}
      <aside 
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "hidden xl:flex flex-col h-screen sticky top-0 bg-primary transition-all duration-300 ease-in-out shrink-0 z-40",
          isRTL ? "border-l border-primary/20" : "border-r border-primary/20", 
          isCollapsed ? "w-[68px]" : "w-[250px]" 
        )}
      >
        {/* Header - Shrink 0 */}
        <div className={cn("flex items-center h-[64px] shrink-0 transition-all border-b border-white/5", isCollapsed ? "justify-center px-0" : "justify-between px-5")}>
          <Link href="/manager" className={cn("flex items-center gap-3 overflow-hidden transition-all duration-300", isCollapsed && "hidden")}>
            <img src="/photos/logo.png" alt="Logo" className="w-8 h-8 rounded-xl object-contain bg-white/10 p-1 border border-white/5 shadow-sm" />
            <span className="font-bold text-[14px] text-white tracking-widest whitespace-nowrap">
              {t("managerPanel")}
            </span>
          </Link>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300",
              isCollapsed && "w-10 h-10 rounded-xl bg-white/5 border border-white/10 mx-auto hover:bg-white/10"
            )}
          >
            {isCollapsed ? <Menu size={18} strokeWidth={2.5} /> : (isRTL ? <PanelRightClose size={18} /> : <PanelLeftClose size={18} />)}
          </button>
        </div>

        {/* Scrollable Nav Area - flex-1 & min-h-0 تضمن نجاح التمرير بنسبة 100% */}
        <ScrollArea className="flex-1 w-full min-h-0" dir={isRTL ? "rtl" : "ltr"}>
          <nav className="px-3 pt-3 pb-4">
            {navData.map((section, idx) => (
              <NavItem key={idx} section={section} />
            ))}
          </nav>
        </ScrollArea>

        {/* Fixed Footer (Notification, Language, Account) - Shrink 0 */}
        <div className="shrink-0 p-3 mt-auto bg-primary z-10">
          <div className={cn(
            "bg-white/5 border border-white/10 flex transition-all duration-300",
            isCollapsed 
              ? "flex-col items-center gap-4 py-4 px-2 rounded-[18px]" // شكل طولي منسق أثناء الإغلاق بنفس الخلفية
              : "flex-row justify-between items-center p-3 rounded-xl" // شكل أفقي جميل أثناء الفتح
          )}>
            <NotificationBell />
            <LanguageSwitcher />
            
  
        
              <AccountInfo />
          </div>
        </div>
      </aside>
    </>
  )
}