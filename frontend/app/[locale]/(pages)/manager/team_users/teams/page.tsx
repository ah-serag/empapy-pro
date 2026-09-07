"use client"

import React, { useState } from "react"
import { useTranslations } from "next-intl"
import { Search, Plus, Edit, Trash2, Users, ChevronLeft, ChevronRight, Eye, Power } from "lucide-react"
import { toast } from "sonner"

import CreateTeam from "@/components/teams/CreateTeam"
import ViewTeam from "@/components/teams/ViewTeam"

import { useGetTeamsQuery, useDeleteTeamMutation, useUpdateTeamStatusMutation } from "@/redux/features/teamsApiSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function TeamsManagementPage() {
  const t = useTranslations("TeamsOperations")

  const [search, setSearch] = useState("")
  const [teamType, setTeamType] = useState("all")
  const [isActive, setIsActive] = useState("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Modals State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const [manageTeamId, setManageTeamId] = useState<number | null>(null)
  const [deleteItem, setDeleteItem] = useState<{ id: number, name: string } | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [teamToView, setTeamToView] = useState<any | null>(null)

  // API Hooks
  const { data: teamsData, isLoading } = useGetTeamsQuery({ search, team_type: teamType, is_active: isActive, page, limit })
  const teamsList = teamsData?.data?.teams || []
  const pagination = teamsData?.data?.pagination

  const [deleteTeam] = useDeleteTeamMutation()
  const [updateTeamStatus, { isLoading: isUpdatingStatus }] = useUpdateTeamStatusMutation()

  // Handlers
  const openTeamAdd = () => { 
    setSelectedTeam(null)
    setIsTeamModalOpen(true)
  }
  
  const openTeamEdit = (team: any) => { 
    setSelectedTeam(team)
    setIsTeamModalOpen(true)
  }

  const openTeamView = (team: any) => {
    setTeamToView(team)
    setIsViewModalOpen(true)
  }

  const openManageMembers = (teamId: number) => {
    setManageTeamId(teamId)
    setIsMembersModalOpen(true)
  }

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await updateTeamStatus({ id, is_active: !currentStatus }).unwrap()
      toast.success(
        !currentStatus 
          ? ("تم تفعيل الفريق بنجاح") 
          : ( "تم تعطيل الفريق بنجاح")
      )
    } catch (err: any) {
      toast.error(err?.data?.message || t("toast.errorUpdatingStatus") || "حدث خطأ أثناء تغيير حالة الفريق")
    }
  }

  const confirmDelete = async () => {
    if (!deleteItem) return
    try {
      await deleteTeam(deleteItem.id).unwrap()
      toast.success(t("toast.teamDeleted"))
      setDeleteItem(null)
    } catch (err: any) { 
      toast.error(err?.data?.message || t("toast.errorDeletingTeam")) 
    }
  }

  return (
    <div className="space-y-6 w-full max-w-dvw p-4 md:p-6  overflow-hidden bg-slate-50/50 min-h-screen">
      
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
          <p className="text-slate-500 mt-1 text-sm sm:text-base font-light">{t("header.description")}</p>
        </div>
        <Button onClick={openTeamAdd} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm h-11 px-5 transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> {t("header.createBtn")}
        </Button>
      </div>

      {/* Filters Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm w-full">
        <div className="sm:col-span-2 relative w-full">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder={t("filters.search")} 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            className="pl-11 pr-4 w-full rounded-xl border-slate-200 shadow-sm h-11 bg-slate-50/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary text-slate-900" 
          />
        </div>

        {/* فلتر نوع الخدمة */}
        <div className="w-full">
          <Select value={teamType} onValueChange={(val) => { setTeamType(val); setPage(1); }}>
            <SelectTrigger className="w-full h-11 bg-slate-50/50 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 text-slate-900 px-4">
              <SelectValue placeholder={t("filters.allServices")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
              <SelectItem value="all" className="rounded-lg">{t("filters.allServices")}</SelectItem>
              <SelectItem value="installation" className="rounded-lg">{t("filters.installation")}</SelectItem>
              <SelectItem value="maintenance" className="rounded-lg">{t("filters.maintenance")}</SelectItem>
              <SelectItem value="mixed" className="rounded-lg">{t("filters.mixed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* فلتر الحالة */}
        <div className="w-full">
          <Select value={isActive} onValueChange={(val) => { setIsActive(val); setPage(1); }}>
            <SelectTrigger className="w-full h-11 bg-slate-50/50 border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 text-slate-900 px-4">
              <SelectValue placeholder={t("filters.allStatuses")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
              <SelectItem value="all" className="rounded-lg">{t("filters.allStatuses")}</SelectItem>
              <SelectItem value="true" className="rounded-lg">{t("filters.activeOnly")}</SelectItem>
              <SelectItem value="false" className="rounded-lg">{t("filters.inactiveOnly")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400 font-light shadow-sm">
          {t("loading")}
        </div>
      )}

      {!isLoading && teamsList.length === 0 && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400 font-light shadow-sm">
          {t("noResults")}
        </div>
      )}

      {/* Data Presentation */}
      {!isLoading && teamsList.length > 0 && (
        <>
          {/* 1. Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {teamsList.map((team: any) => (
              <div key={team.id} className=" border border-slate-200/60 flex flex-col gap-4 shadow-sm rounded-2xl">
                <div className="flex p-5  rounded-t-lg justify-between bg-gray-100  items-start gap-4">
                  <div>
                    <h3 className="text-base font-medium  text-slate-900 break-words">{team.name}</h3>
                    <div className="flex items-center text-xs text-slate-400 mt-1 capitalize font-light">
                      {t(`filters.${team.team_type}`)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(team.id, team.is_active)}
                    disabled={isUpdatingStatus}
                    className="focus:outline-none transition-transform active:scale-95 disabled:opacity-50"
                    title="اضغط لتغيير الحالة"
                  >
                    <Badge 
                      className={`rounded-full px-3 py-1 font-medium transition-colors border shadow-none text-xs flex items-center gap-1.5 cursor-pointer ${
                        team.is_active 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${team.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                      {team.is_active ? t("status.active") : t("status.inactive")}
                    </Badge>
                  </button>
                </div>

                {/* عرض الأعضاء على الهواتف */}
                {team?.members && team.members.length > 0 && (
                  <div className=" bg-slate-50/50   p-6 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                    <span className="font-semibold text-slate-700 block mb-1">{t("table.member")}:</span>
                    <div className="flex flex-wrap gap-1">
                      {team.members.map((m: any, i: number) => (
                        <span key={i} className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium text-primary">
                          {m.full_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 p-5 sm:flex sm:flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-slate-700 bg-white hover:bg-slate-50 rounded-xl justify-center border-slate-200 h-10 text-xs shadow-sm" onClick={() => openTeamView(team)}>
                    <Eye className="w-4 h-4 mr-1.5 text-primary" /> {t("table.view")}
                  </Button>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 justify-center h-10 text-xs shadow-sm" onClick={() => openManageMembers(team.id)}>
                    <Users className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> {t("actions.manageMembers")}
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-full sm:w-10 text-slate-600 bg-white hover:bg-slate-50 rounded-xl border-slate-200 shadow-sm" onClick={() => openTeamEdit(team)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-full sm:w-10 text-red-600 bg-white hover:bg-red-50 rounded-xl border-slate-200 shadow-sm" onClick={() => setDeleteItem({ id: team.id, name: team.name })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block border border-slate-200/60 bg-white shadow-sm w-full overflow-x-auto rounded-2xl">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-[6%] text-slate-500 font-medium py-4 text-center">{t("table.view")}</TableHead>
                  <TableHead className="w-[30%] text-slate-500 font-medium py-4">{t("table.profile")}</TableHead>
                  <TableHead className="w-[35%] text-slate-500 font-medium py-4">{t("table.member")}</TableHead>
                  <TableHead className="w-[14%] text-slate-500 font-medium py-4">{t("table.status")}</TableHead>
                  <TableHead className="text-right w-[15%] text-slate-500 font-medium py-4 px-6">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamsList.map((team: any) => (
                  <TableRow key={team.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="align-middle px-5 py-4 text-center">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors" onClick={() => openTeamView(team)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="align-middle py-4">
                      <span className="text-sm font-medium text-slate-800">{team.name}</span>
                      <div className="flex items-center text-xs text-slate-400 mt-0.5 capitalize font-light">
                         {t(`filters.${team.team_type}`)}
                      </div>
                    </TableCell>

                    <TableCell className="align-middle py-4">
                      <div className="flex flex-wrap gap-1">
                        {team?.members && team.members.length > 0 ? (
                          team.members.map((member: any, idx: number) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                              {member.full_name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 font-light">-</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="align-middle py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(team.id, team.is_active)}
                        disabled={isUpdatingStatus}
                        className="focus:outline-none transition-transform active:scale-95 disabled:opacity-50"
                        title="اضغط لتغيير الحالة"
                      >
                        <Badge 
                          className={`rounded-full px-3 py-1 font-medium transition-colors border shadow-none text-xs flex items-center gap-1.5 cursor-pointer ${
                            team.is_active 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${team.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                          {team.is_active ? t("status.active") : t("status.inactive")}
                        </Badge>
                      </button>
                    </TableCell>

                    <TableCell className="text-right whitespace-nowrap align-middle py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 h-9 text-xs px-3" onClick={() => openManageMembers(team.id)}>
                          <Users className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> {t("actions.manageMembers")}
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={`h-9 w-9 rounded-xl transition-colors ${team.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                          onClick={() => handleToggleStatus(team.id, team.is_active)}
                          title={team.is_active ? "تعطيل الفريق" : "تفعيل الفريق"}
                        >
                          <Power className="w-4 h-4" />
                        </Button>

                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors" onClick={() => openTeamEdit(team)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" onClick={() => setDeleteItem({ id: team.id, name: team.name })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Pagination Controls */}
      {pagination && (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-200/60 shadow-sm mt-4 rounded-2xl">
          <div className="text-sm text-slate-500 font-light text-center lg:text-left">
            {t("pagination.showing")} <span className="font-medium text-slate-800">{teamsList.length}</span> {t("pagination.of")}{" "}
            <span className="font-medium text-slate-800">{pagination.total_records}</span> {t("pagination.results")}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-light">
              <span>{t("pagination.rows")}:</span>
              <Select value={limit.toString()} onValueChange={(val) => { setLimit(parseInt(val, 10)); setPage(1); }}>
                <SelectTrigger className="h-9 w-[75px] px-4 rounded-xl border-slate-200 bg-slate-50/50 shadow-sm text-xs focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
                  <SelectItem value="5" className="rounded-lg text-xs">5</SelectItem>
                  <SelectItem value="10" className="rounded-lg text-xs">10</SelectItem>
                  <SelectItem value="20" className="rounded-lg text-xs">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1 bg-slate-50/50 p-1 border border-slate-200/60 rounded-xl shadow-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:text-primary hover:bg-white bg-transparent disabled:opacity-50" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              </Button>
              <div className="text-xs font-medium px-3 text-slate-600">{t("pagination.page")} {pagination.current_page} / {pagination.total_pages || 1}</div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:text-primary hover:bg-white bg-transparent disabled:opacity-50" onClick={() => setPage((p) => Math.min(p + 1, pagination.total_pages))} disabled={page === pagination.total_pages || pagination.total_pages === 0}>
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateTeam isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} selectedTeam={selectedTeam} />
      <ViewTeam 
        isViewModalOpen={isViewModalOpen} setIsViewModalOpen={setIsViewModalOpen} teamToView={teamToView}
        isMembersModalOpen={isMembersModalOpen} setIsMembersModalOpen={setIsMembersModalOpen} manageTeamId={manageTeamId} 
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent className="w-[95vw] sm:max-w-[425px] rounded-2xl border border-slate-200 shadow-2xl bg-white p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-medium text-xl text-red-600 pt-2">{t("delete.title")}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 mt-2 text-sm font-light">
              {t("delete.descriptionStart")} <span className="font-medium text-slate-800">{deleteItem?.name}</span> {t("delete.descriptionEnd")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <AlertDialogCancel className="mt-0 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-11 w-full sm:w-auto shadow-sm">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className="bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto rounded-xl border-none h-11 shadow-sm">{t("delete.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}