"use client"

import React, { useState } from "react"
import { useGetUsersQuery, useToggleUserStatusMutation, useDeleteUserMutation } from "@/redux/features/authApiSlice"
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Users, Calendar, Phone, Mail, Shield, Trash2, UserCheck, UserX, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

export default function UsersManagementPage() {
  const t = useTranslations("UsersManagementPage")

  // ================= STATES =================
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("all")
  const [isActive, setIsActive] = useState("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortBy, setSortBy] = useState("created_at")
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC")
  
  // حالة لإدارة حذف يوزر معين
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null)

  // ================= API HOOKS =================
  const { data, isLoading, error } = useGetUsersQuery({
    search,
    role,
    is_active: isActive,
    page,
    limit,
    sort_by: sortBy,
    order,
  })

  const [toggleStatus, { isLoading: isTogglingStatus }] = useToggleUserStatusMutation()
  const [deleteUserAccount] = useDeleteUserMutation()

  const usersList = data?.data?.users || []
  const pagination = data?.data?.pagination

  // ================= HANDLERS =================
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setOrder(order === "ASC" ? "DESC" : "ASC")
    } else {
      setSortBy(column)
      setOrder("DESC")
    }
    setPage(1)
  }

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await toggleStatus({ id, is_active: !currentStatus }).unwrap()
      toast.success(response.message || t("toast.statusUpdated"))
    } catch (err: any) {
      toast.error(err?.data?.message || t("toast.statusFailed"))
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    try {
      const response = await deleteUserAccount(userToDelete.id).unwrap()
      toast.success(response.message || t("toast.userDeleted"))
      setUserToDelete(null)
    } catch (err: any) {
      toast.error(err?.data?.message || t("toast.deleteFailed"))
    }
  }

  if (error) {
    const err = error as any
    toast.error(err?.data?.message || t("toast.loadFailed"))
  }

  return (
    <div className="space-y-6 w-full p-4 md:p-6 max-w-dvw overflow-hidden bg-slate-50/50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-primary">{t("header.title")}</h1>
            {pagination && (
              <Badge className="bg-primary/10 text-primary border-transparent rounded-full font-medium px-3 py-0.5 text-xs shadow-none">
                {pagination.total_records}
              </Badge>
            )}
          </div>
          <p className="text-slate-500 mt-1 text-sm sm:text-base font-light">
            {t("header.description")}
          </p>
        </div>
      </div>

      {/* Control Panel (استخدام Shadcn Select للفلترة) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm w-full">
        <div className="sm:col-span-2 relative w-full">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t("controls.searchPlaceholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-11 pr-4 w-full rounded-xl border-slate-200 shadow-sm h-11 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary text-slate-900"
          />
        </div>

        {/* فلتر الأدوار */}
        <div className="w-full">
          <Select value={role} onValueChange={(val) => { setRole(val); setPage(1); }}>
            <SelectTrigger className="w-full h-11 bg-slate-50/50 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 text-slate-900 px-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                <SelectValue placeholder={t("controls.roles.all")} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
              <SelectItem value="all" className="rounded-lg">{t("controls.roles.all")}</SelectItem>
              <SelectItem value="superadmin" className="rounded-lg">{t("controls.roles.superadmin")}</SelectItem>
              <SelectItem value="admin" className="rounded-lg">{t("controls.roles.admin")}</SelectItem>
              <SelectItem value="supervisor" className="rounded-lg">{t("controls.roles.supervisor")}</SelectItem>
              <SelectItem value="technician" className="rounded-lg">{t("controls.roles.technician")}</SelectItem>
              <SelectItem value="client" className="rounded-lg">{t("controls.roles.client")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* فلتر الحالة */}
        <div className="w-full">
          <Select value={isActive} onValueChange={(val) => { setIsActive(val); setPage(1); }}>
            <SelectTrigger className="w-full h-11 bg-slate-50/50 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 text-slate-900 px-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <SelectValue placeholder={t("controls.status.all")} />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
              <SelectItem value="all" className="rounded-lg">{t("controls.status.all")}</SelectItem>
              <SelectItem value="true" className="rounded-lg">{t("controls.status.active")}</SelectItem>
              <SelectItem value="false" className="rounded-lg">{t("controls.status.inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400 font-light shadow-sm">
          {t("loading")}
        </div>
      )}

      {!isLoading && usersList.length === 0 && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400 font-light shadow-sm">
          {t("noResults")}
        </div>
      )}

      {/* Presentation Layer */}
      {!isLoading && usersList.length > 0 && (
        <>
          {/* Desktop/Tablet View */}
          <div className="hidden lg:block border border-slate-200/60 bg-white shadow-sm w-full overflow-x-auto rounded-2xl">
            <Table className="min-w-[950px]">
              <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="cursor-pointer select-none py-4 text-slate-500 font-medium hover:text-slate-900 transition-colors" onClick={() => handleSort("full_name")}>
                    <div className="flex items-center gap-1.5">{t("table.fullName")} <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none py-4 text-slate-500 font-medium hover:text-slate-900 transition-colors" onClick={() => handleSort("email")}>
                    <div className="flex items-center gap-1.5">{t("table.email")} <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /></div>
                  </TableHead>
                  <TableHead className="py-4 text-slate-500 font-medium">{t("table.phone")}</TableHead>
                  <TableHead className="cursor-pointer select-none py-4 text-slate-500 font-medium hover:text-slate-900 transition-colors" onClick={() => handleSort("role")}>
                    <div className="flex items-center gap-1.5">{t("table.role")} <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none py-4 text-slate-500 font-medium hover:text-slate-900 transition-colors" onClick={() => handleSort("is_active")}>
                    <div className="flex items-center gap-1.5">{t("table.status")} <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none py-4 text-slate-500 font-medium hover:text-slate-900 transition-colors" onClick={() => handleSort("created_at")}>
                    <div className="flex items-center gap-1.5">{t("table.registered")} <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /></div>
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap py-4 text-slate-500 font-medium px-6">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersList.map((user: any) => (
                  <TableRow key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium whitespace-nowrap py-4 text-slate-900">{user.full_name}</TableCell>
                    <TableCell className="whitespace-nowrap py-4 text-slate-600 text-sm">{user.email}</TableCell>
                    <TableCell className="whitespace-nowrap py-4 text-slate-600 text-sm">{user.phone}</TableCell>
                    <TableCell className="capitalize whitespace-nowrap py-4">
                      <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-700 bg-slate-100 font-medium text-xs px-2.5 py-0.5">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        disabled={isTogglingStatus}
                        className="focus:outline-none transition-transform active:scale-95 disabled:opacity-50"
                        title={user.is_active ? t("actions.deactivate") : t("actions.activate")}
                      >
                        <Badge 
                          className={`rounded-full px-3 py-1 font-medium transition-colors border shadow-none text-xs flex items-center gap-1.5 cursor-pointer ${
                            user.is_active 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${user.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                          {user.is_active ? t("status.active") : t("status.inactive")}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-400 text-xs py-4">
                      {new Date(user.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap py-4 px-6">
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                          title={user.is_active ? t("actions.deactivate") : t("actions.activate")}
                          className={`h-9 w-9 rounded-xl transition-colors ${user.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          disabled={isTogglingStatus}
                        >
                          {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          onClick={() => setUserToDelete({ id: user.id, name: user.full_name })}
                          title={t("actions.delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout - تصميم أنيق ومتجاوب جداً للموايل */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {usersList.map((user: any) => (
              <div key={user.id} className="bg-white border border-slate-200/60 rounded-2xl flex flex-col gap-3 shadow-sm overflow-hidden ">
                <div className="flex justify-between bg-gray-100 p-5  items-start gap-4 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <h3 className="font-medium text-base text-slate-900">{user.full_name}</h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-700 bg-slate-100 text-[10px] px-2 py-0.5 font-medium">
                        {user.role}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        disabled={isTogglingStatus}
                        className="focus:outline-none"
                      >
                        <Badge className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border shadow-none ${user.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {user.is_active ? t("status.active") : t("status.inactive")}
                        </Badge>
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    #{user.id}
                  </span>
                </div>

                <div className="space-y-2 text-xs p-5 sm:text-sm text-slate-600 font-light pt-1">
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="truncate">{user.email}</span></div>
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span>{user.phone}</span></div>
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                    <span>{t("mobile.joined")}: {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* كتل العمليات في الموبايل */}
                <div className="pt-3 border-t p-5  border-slate-100 flex flex-wrap justify-between gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs rounded-xl h-10 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm" 
                    onClick={() => handleToggleStatus(user.id, user.is_active)}
                    disabled={isTogglingStatus}
                  >
                    {user.is_active ? <UserX className="w-3.5 h-3.5 mr-1.5 text-amber-600" /> : <UserCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />}
                    {user.is_active ? t("actions.deactivate") : t("actions.activate")}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs rounded-xl h-10 border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm"
                    onClick={() => setUserToDelete({ id: user.id, name: user.full_name })}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> {t("actions.deleteBtn")}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination && (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-200/60 shadow-sm mt-4 rounded-2xl">
              <div className="text-sm text-slate-500 font-light text-center lg:text-left">
                {t("pagination.showingRows")} <span className="font-medium text-slate-800">{usersList.length}</span> {t("pagination.of")}{" "}
                <span className="font-medium text-slate-800">{pagination.total_records}</span> {t("pagination.totalResults")}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-light">
                  <span>{t("pagination.rowsPerPage")}:</span>
                  <Select value={limit.toString()} onValueChange={(val) => { setLimit(parseInt(val, 10)); setPage(1); }}>
                    <SelectTrigger className="h-9 w-[75px] px-4 rounded-xl border-slate-200 bg-slate-50/50 shadow-sm text-xs focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
                      <SelectItem value="5" className="rounded-lg text-xs">5</SelectItem>
                      <SelectItem value="10" className="rounded-lg text-xs">10</SelectItem>
                      <SelectItem value="20" className="rounded-lg text-xs">20</SelectItem>
                      <SelectItem value="50" className="rounded-lg text-xs">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1 bg-slate-50/50 p-1 border border-slate-200/60 rounded-xl shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-slate-500 hover:text-primary hover:bg-white bg-transparent disabled:opacity-50"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                  
                  <div className="text-xs font-medium px-3 text-slate-600">
                    {t("pagination.page")} {pagination.current_page} {t("pagination.ofPage")} {pagination.total_pages || 1}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-slate-500 hover:text-primary hover:bg-white bg-transparent disabled:opacity-50"
                    onClick={() => setPage((p) => Math.min(p + 1, pagination.total_pages))}
                    disabled={page === pagination.total_pages || pagination.total_pages === 0}
                  >
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal - Rounded Corner Style */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="w-[95vw] sm:max-w-[425px] rounded-2xl border border-slate-200 shadow-2xl bg-white p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-medium text-xl text-red-600 pt-2">{t("modal.title")}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 mt-2 text-sm font-light">
              {t("modal.descriptionStart")} <span className="font-medium text-slate-800">{userToDelete?.name}</span> {t("modal.descriptionEnd")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <AlertDialogCancel className="mt-0 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-11 w-full sm:w-auto shadow-sm">{t("modal.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDeleteUser(); }} className="bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto rounded-xl border-none h-11 shadow-sm">{t("modal.confirmDelete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}