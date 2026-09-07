"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Users, Combine, Activity, Mail, Phone, MessageCircle, MapPin, Info, UserPlus, UserMinus } from "lucide-react"
import { toast } from "sonner"

import { teamMemberSchema, TeamMemberFormValues } from "@/lib/validation/teamSchema"
import { useGetTeamByIdQuery, useAddTeamMemberMutation, useRemoveTeamMemberMutation } from "@/redux/features/teamsApiSlice"
import { useGetUsersListQuery } from "@/redux/features/authApiSlice" 
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

interface ViewTeamProps {
  isViewModalOpen: boolean
  setIsViewModalOpen: (val: boolean) => void
  teamToView: any | null
  isMembersModalOpen: boolean
  setIsMembersModalOpen: (val: boolean) => void
  manageTeamId: number | null
}

export default function ViewTeam ({ isViewModalOpen, setIsViewModalOpen, teamToView, isMembersModalOpen, setIsMembersModalOpen, manageTeamId }: ViewTeamProps) {
  const t = useTranslations("TeamsOperations")

  const { data: techniciansData } = useGetUsersListQuery("technician,supervisor")
  const techniciansList = techniciansData?.data || []

  const { data: specificTeamData, isLoading: isTeamLoading } = useGetTeamByIdQuery(manageTeamId!, { skip: !manageTeamId })
  const specificTeam = specificTeamData?.data

  const [addMember, { isLoading: isAddingMember }] = useAddTeamMemberMutation()
  const [removeMember] = useRemoveTeamMemberMutation()

  const memberForm = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: { user_id: 0, role_in_team: "member", joined_at: new Date().toISOString().split('T')[0] }
  })

  const onMemberSubmit: SubmitHandler<TeamMemberFormValues> = async (values) => {
    if (!manageTeamId) return
    try {
      await addMember({ teamId: manageTeamId, data: values }).unwrap()
      toast.success(t("toast.memberAdded"))
      memberForm.reset() 
    } catch (err: any) {
      toast.error(err?.data?.message || t("toast.errorAddingMember"))
    }
  }

  const handleRemoveMember = async (userId: number) => {
    if (!manageTeamId) return
    try {
      await removeMember({ teamId: manageTeamId, memberId: userId }).unwrap()
      toast.success(t("toast.memberRemoved"))
    } catch (err: any) {
      toast.error(err?.data?.message || t("toast.errorRemovingMember"))
    }
  }

  const openWhatsApp = (phone: string | undefined) => {
    if (!phone) return
    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.startsWith('01')) formattedPhone = `2${formattedPhone}`
    window.open(`https://wa.me/${formattedPhone}`, '_blank')
  }

  return (
    <>
      {/* Full Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent  showCloseButton={true } className="w-[95vw] sm:max-w-[700px] rounded-lg border-none bg-gray-100 p-0 shadow-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader className="sr-only bg-secondary"><DialogTitle className=" ">{t("view.title")}</DialogTitle></DialogHeader>
          
          {teamToView && (
            <div className="space-y-8 ">
              {/* Header Section */}
              <div className="flex items-start flex-col gap-3  pt-16 bg-secondary p-5  border-b border-slate-100 pb-4">
                <div className=" flex-col  items-start">
                  <h2 className="text-2xl items-center font-light text-slate-100 flex gap-2">{teamToView.name}</h2>
                  <div className="flex  text-sm text-slate-100 mt-2 gap-5">
                    <span className="flex text-start  gap-1 capitalize"> {teamToView.team_type}</span>
                    <span className="flex text-start   gap-1"><Activity className="w-4 h-4"/> {teamToView.max_daily_tasks} {t("view.tasksDay")}</span>
                 </div>
                </div>
                <Badge variant={teamToView.is_active ? "default" : "secondary"} className="rounded-lg item-start font-normal p-2 bg-slate-100 text-slate-800 hover:bg-slate-100">
                  {teamToView.is_active ? t("status.activeTeam") : t("status.inactiveTeam")}
                </Badge>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 p-5 sm:grid-cols-2   bg-slate-100 gap-6">
                <div className="bg-slate-50  rounded-lg shadow-sm">
                  <h3 className="text-xs font-semibold rounded-t-md bg-secondary p-2 text-white uppercase tracking-widest mb-3">{t("view.supervisor")}</h3>
                  {teamToView.supervisor_name ? (
                    <div className="p-4">
                      <span className="font-medium text-slate-800">{teamToView.supervisor_name}</span>
                      <div className="text-sm text-slate-500 flex items-center gap-2 mt-2">
                        <Mail className="w-4 h-4 text-slate-400"/> {teamToView.supervisor_email}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-slate-400"/> {teamToView.supervisor_phone || 'N/A'}
                        {teamToView.supervisor_phone && <MessageCircle className="w-4 h-4 text-emerald-500 cursor-pointer hover:opacity-80" onClick={() => openWhatsApp(teamToView.supervisor_phone)}/>}
                      </div>
                    </div>
                  ) : <span className="text-slate-400 italic text-sm">{t("view.noSupervisor")}</span>}
                </div>
                <div className="bg-slate-50 rounded-lg shadow-sm">
                  <h3 className="text-xs font-semibold rounded-t-md bg-secondary p-2 text-white uppercase tracking-widest mb-3">{t("view.operatingZone")}</h3>
                  {teamToView.zone_name_en ? (
                    <div className="flex items-start  p-4 gap-2 text-slate-800">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" /> 
                      <span>{teamToView.governorate_name_en} <br/><span className="text-sm text-slate-500">{teamToView.zone_name_en}</span></span>
                    </div>
                  ) : <span className="text-slate-400 italic text-sm">{t("view.noZone")}</span>}
                </div>
              </div>

              {/* Members List */}
              <div className="p-5 bg-slate-100">
                <h3 className="text-xs font-semibold rounded-md  bg-secondary p-2 text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4"/> {t("view.assignedAgents")} ({teamToView.members?.length || 0})
                </h3>
                {teamToView.members && teamToView.members.length > 0 ? (
                  <div className="grid grid-cols-1  sm:grid-cols-2 gap-3">
                    {teamToView.members.map((member: any) => (
                      <div key={member.user_id} className="bg-slate-50 p-3 flex flex-col gap-2 rounded-lg shadow-sm border border-slate-200/60">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-sm text-slate-800">{member.full_name}</span>
                          <span className="text-[10px] uppercase text-slate-500 bg-white px-2 py-1 rounded-md">{member.role_in_team}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400"/> {member.phone || 'N/A'}
                          {member.phone && <MessageCircle className="w-3.5 h-3.5 text-emerald-500 cursor-pointer ml-1" onClick={() => openWhatsApp(member.phone)}/>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 text-slate-400 text-sm flex flex-col items-center justify-center gap-2 rounded-lg">
                    <Info className="w-5 h-5"/> {t("view.noAgents")}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Members Management Modal */}
      <Dialog open={isMembersModalOpen} onOpenChange={setIsMembersModalOpen}>
        <DialogContent showCloseButton={true} className="w-[95vw] p-0 sm:max-w-[700px] rounded-lg border-none bg-white  shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className= " "><DialogTitle className="font-light  p-6 pt-16 w-full bg-secondary  text-xl text-white">{t("members.title")}</DialogTitle></DialogHeader>
          {isTeamLoading ? (
            <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" /></div>
          ) : (
            <div className="space-y-6 p-6  mt-4">
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 shadow-sm">
                <h4 className="text-xs font-semibold mb-3 text-slate-500 uppercase tracking-widest flex items-center"><UserPlus className="w-3.5 h-3.5 mr-2"/> {t("members.assignTechnician")}</h4>
                <form onSubmit={memberForm.handleSubmit(onMemberSubmit)} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  
                  {/* Select 1: الفني */}
                  <div className="sm:col-span-2">
                    <Controller
                      control={memberForm.control}
                      name="user_id"
                      render={({ field }) => (
                        <Select
                          value={field.value ? String(field.value) : undefined}
                          onValueChange={(val) => field.onChange(Number(val))}
                        >
                          <SelectTrigger className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 shadow-sm">
                            <SelectValue placeholder={t("members.chooseRoster")} />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            {techniciansList.map((u: any) => (
                              <SelectItem key={u.id} value={String(u.id)}>
                                {u.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Select 2: الدور */}
                  <div>
                    <Controller
                      control={memberForm.control}
                      name="role_in_team"
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 shadow-sm">
                            <SelectValue placeholder={t("roles.member")} />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="leader">{t("roles.leader")}</SelectItem>
                            <SelectItem value="member">{t("roles.member")}</SelectItem>
                            <SelectItem value="trainee">{t("roles.trainee")}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={isAddingMember} className="rounded-lg h-10 bg-secondary hover:bg-secondary/80 text-white border-none shadow-sm transition-all">
                    {isAddingMember ? <Loader2 className="h-4 w-4 animate-spin"/> : t("members.assignBtn")}
                  </Button>
                </form>
              </div>

              <div>
                <h4 className="text-xs font-semibold mb-3 text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">{t("members.activeAgents")}</h4>
                {specificTeam?.members && specificTeam.members.filter((m:any) => m.membership_active).length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-slate-100 shadow-sm">
                    <Table>
                      <TableBody>
                        {specificTeam.members.filter((m:any) => m.membership_active).map((member: any) => (
                          <TableRow key={member.membership_id} className="border-b border-slate-100 hover:bg-slate-50/50 bg-white">
                            <TableCell className="py-3 px-4 text-sm">
                              <div className="font-medium text-slate-800">{member.full_name}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{member.email}</div>
                            </TableCell>
                            <TableCell className="py-3 text-sm capitalize text-slate-500">{member.role_in_team}</TableCell>
                            <TableCell className="py-3 px-4 text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.user_id)} className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                                <UserMinus className="w-3.5 h-3.5 mr-1" /> {t("members.removeBtn")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 rounded-lg shadow-sm border border-slate-100">
                    {t("members.noActiveMembers")}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}