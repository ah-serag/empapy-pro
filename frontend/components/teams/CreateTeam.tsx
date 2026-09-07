"use client"

import React, { useEffect } from "react"
import { useTranslations } from "next-intl"
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { teamSchema, TeamFormValues } from "@/lib/validation/teamSchema"
import { useCreateTeamMutation, useUpdateTeamMutation } from "@/redux/features/teamsApiSlice"
import { useGetUsersListQuery } from "@/redux/features/authApiSlice" 
import LocationSelector from "@/components/shared/LocationSelector" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateTeamProps {
  isOpen: boolean
  onClose: () => void
  selectedTeam: any | null
}

export default function CreateTeam({ isOpen, onClose, selectedTeam }: CreateTeamProps) {
  const t = useTranslations("TeamsOperations")

  const { data: supervisorsData } = useGetUsersListQuery("supervisor")
  const supervisorsList = supervisorsData?.data || []

  const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation()
  const [updateTeam, { isLoading: isUpdating }] = useUpdateTeamMutation()

  const teamForm = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", team_type: "mixed", governorate_id: 0, zone_id: 0, supervisor_id: 0, max_daily_tasks: 5, notes: "", is_active: true }
  })

  useEffect(() => {
    if (selectedTeam && isOpen) {
      teamForm.reset({
        name: selectedTeam.name,
        team_type: selectedTeam.team_type,
        governorate_id: selectedTeam.governorate_id || 0,
        zone_id: selectedTeam.zone_id || 0,
        supervisor_id: selectedTeam.supervisor_id || 0,
        max_daily_tasks: selectedTeam.max_daily_tasks,
        notes: selectedTeam.notes || "",
        is_active: selectedTeam.is_active
      })
    } else if (!selectedTeam && isOpen) {
      teamForm.reset({ name: "", team_type: "mixed", governorate_id: 0, zone_id: 0, supervisor_id: 0, max_daily_tasks: 5, notes: "", is_active: true })
    }
  }, [selectedTeam, isOpen, teamForm])

  const onTeamSubmit: SubmitHandler<TeamFormValues> = async (values) => {
    try {
      const { governorate_id, ...backendData } = values
      if (selectedTeam) {
        await updateTeam({ id: selectedTeam.id, data: backendData }).unwrap()
      } else {
        await createTeam(backendData).unwrap()
      }
      toast.success(selectedTeam ? t("toast.teamUpdated") : t("toast.teamCreated"))
      onClose()
    } catch (err: any) {
      toast.error(err?.data?.message || t("toast.errorSavingTeam"))
    }
  }

  const checkValid = teamForm?.formState?.isValid  

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* 
        flex flex-col & max-h-[90vh] & overflow-hidden: 
        هذه الكلاسات تضمن أن النافذة لا تتجاوز 90% من الشاشة وتسمح للمحتوى الداخلي بالتمرير 
      */}
      <DialogContent className="w-[95vw] sm:max-w-[550px] p-0 rounded-2xl border-none bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" dir="rtl">
        
        {/* ================= Header (ثابت) ================= */}
        <div className="w-full shrink-0 bg-primary px-5 py-4 z-10 text-right rounded-t-2xl">
          <DialogTitle className="font-bold text-sm sm:text-base text-white m-0">
            {selectedTeam ? t("createEdit.editTitle") : t("createEdit.createTitle")}
          </DialogTitle>
        </div>
        
        {/* ================= Content (قابل للتمرير) ================= */}
        {/* 
          flex-1: ليأخذ المساحة المتبقية
          overflow-y-auto: لتفعيل التمرير العمودي
          min-h-0: لحل مشكلة التمرير في عناصر flex 
        */}
        <div className="flex-1 overflow-y-auto min-h-0 w-full bg-slate-50/30 p-4 sm:p-5">
          <form id="team-form" onSubmit={teamForm.handleSubmit(onTeamSubmit)} className="flex flex-col gap-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">{t("createEdit.teamName")}</label>
                <Input 
                  {...teamForm.register("name")} 
                  className="rounded-lg px-3 h-10 text-[12px] border-slate-200 bg-white focus-visible:ring-1 focus-visible:ring-primary shadow-sm w-full transition-all" 
                  placeholder={t("createEdit.teamNamePlaceholder")} 
                />
                {teamForm.formState.errors.name && <span className="text-[10px] font-bold text-red-500">{teamForm.formState.errors.name.message}</span>}
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">{t("createEdit.serviceType")}</label>
                <Controller
                  control={teamForm.control}
                  name="team_type"
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger className="flex px-3 h-10 w-full border border-slate-200 bg-white text-[12px] rounded-lg focus:ring-1 focus:ring-primary shadow-sm font-bold transition-all">
                        <SelectValue placeholder={t("filters.mixed")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-lg border-slate-200 shadow-xl" dir="rtl">
                        <SelectItem value="installation" className="text-[12px] font-bold py-2">{t("filters.installation")}</SelectItem>
                        <SelectItem value="maintenance" className="text-[12px] font-bold py-2">{t("filters.maintenance")}</SelectItem>
                        <SelectItem value="mixed" className="text-[12px] font-bold py-2">{t("filters.mixed")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3">
              <h4 className="text-[11px] font-bold text-primary block">{t("createEdit.geographicalCoverage")}</h4>
              <LocationSelector 
                selectedGovId={teamForm.watch("governorate_id")}
                selectedZoneId={teamForm.watch("zone_id")}
                onGovChange={(id) => {
                  teamForm.setValue("governorate_id", id)
                  teamForm.setValue("zone_id", 0)
                }}
                onZoneChange={(id) => teamForm.setValue("zone_id", id)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">{t("createEdit.supervisor")}</label>
                <Controller
                  control={teamForm.control}
                  name="supervisor_id"
                  render={({ field }) => (
                    <Select
                      value={field.value && field.value !== 0 ? String(field.value) : undefined}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger className="flex px-3 h-10 w-full border border-slate-200 bg-white text-[12px] rounded-lg focus:ring-1 focus:ring-primary shadow-sm font-bold transition-all">
                        <SelectValue placeholder={t("createEdit.selectSupervisor")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-lg border-slate-200 shadow-xl max-h-48 overflow-y-auto" dir="rtl">
                        {supervisorsList.map((u: any) => (
                          <SelectItem key={u.id} value={String(u.id)} className="text-[12px] font-bold py-2">
                            {u.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">{t("createEdit.maxDailyTasks")}</label>
                <Input 
                  type="number" 
                  {...teamForm.register("max_daily_tasks", { valueAsNumber: true })} 
                  className="rounded-lg px-3 h-10 text-[12px] border-slate-200 bg-white focus-visible:ring-1 focus-visible:ring-primary shadow-sm w-full font-mono font-bold transition-all" 
                />
              </div>
            </div>

          </form>
        </div>

        {/* ================= Footer (ثابت) ================= */}
        <div className="bg-white border-t border-slate-100 px-4 py-3 flex flex-col sm:flex-row justify-end gap-3 shrink-0 z-10 rounded-b-2xl">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            className="w-full sm:w-auto rounded-lg h-10 px-6 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 shadow-sm text-[12px] order-2 sm:order-1 transition-all"
          >
            {t("common.cancel")}
          </Button>
          <Button 
            type="submit" 
            form="team-form"
            disabled={isCreating || isUpdating || !checkValid} 
            className={`w-full sm:w-auto rounded-lg h-10 px-8 font-bold shadow-md text-[12px] order-1 sm:order-2 transition-all active:scale-[0.98] ${!checkValid ? "bg-slate-300 text-slate-500 hover:bg-slate-300" : "bg-primary text-white hover:bg-primary/95"}`}
          >
            {(isCreating || isUpdating) && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>} 
            {selectedTeam ? t("createEdit.saveChanges") : t("createEdit.deployTeam")}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}