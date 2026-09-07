"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Loader2, ShieldCheck, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { teamMemberSchema, TeamMemberFormValues } from "@/lib/validation/authShema"
import { useCreateTeamMemberMutation } from "@/redux/features/authApiSlice"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function CreateTeamMemberPage() {
  const t = useTranslations("CreateAccountPage")
  const router = useRouter()
  
  const [createMember, { isLoading }] = useCreateTeamMemberMutation()

  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: { 
      full_name: "", 
      email: "", 
      phone: "", 
      password: "", 
      role: "technician" 
    },
  })

  const onSubmit: SubmitHandler<TeamMemberFormValues> = async (values) => {
    try {
      const response = await createMember(values).unwrap()
      toast.success(response.message)
      form.reset()
    } catch (err: any) {
      if (err?.data?.message) {
        toast.error(err.data.message) 
      }
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-8 w-full max-w-full overflow-hidden bg-slate-50/50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight flex items-center gap-3 text-primary">
            <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
            {t("header.title")}
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base font-light">
            {t("header.description")}
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-2xl bg-white p-6 sm:p-8 border border-slate-200/60 shadow-sm rounded-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                {t("form.fullName")}
              </label>
              <Input 
                type="text" 
                placeholder={t("form.fullNamePh")} 
                {...form.register("full_name")} 
                className="rounded-xl px-4 h-11 border-slate-200 bg-slate-50/50 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
              />
              {form.formState.errors.full_name && (
                <span className="text-xs text-red-500 mt-1.5 block">{form.formState.errors.full_name.message}</span>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                {t("form.phone")}
              </label>
              <Input 
                type="tel" 
                placeholder={t("form.phonePh")} 
                {...form.register("phone")} 
                className="rounded-xl px-4 h-11 border-slate-200 bg-slate-50/50 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-left dir-ltr"
              />
              {form.formState.errors.phone && (
                <span className="text-xs text-red-500 mt-1.5 block">{form.formState.errors.phone.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                {t("form.email")}
              </label>
              <Input 
                type="email" 
                placeholder={t("form.emailPh")} 
                {...form.register("email")} 
                className="rounded-xl px-4 h-11 border-slate-200 bg-slate-50/50 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-left dir-ltr"
              />
              {form.formState.errors.email && (
                <span className="text-xs text-red-500 mt-1.5 block">{form.formState.errors.email.message}</span>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                {t("form.password")}
              </label>
              <Input 
                type="password" 
                placeholder={t("form.passwordPh")} 
                {...form.register("password")} 
                className="rounded-xl px-4 h-11 border-slate-200 bg-slate-50/50 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-left dir-ltr"
              />
              {form.formState.errors.password && (
                <span className="text-xs text-red-500 mt-1.5 block">{form.formState.errors.password.message}</span>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="pt-6 border-t border-slate-100 mt-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
              {t("form.systemRole")}
            </label>
            <select 
              {...form.register("role")} 
              className="flex h-11 w-full border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm rounded-xl shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-colors"
            >
              <option value="admin">{t("roles.admin")}</option>
              <option value="supervisor">{t("roles.supervisor")}</option>
              <option value="technician">{t("roles.technician")}</option>
              <option value="client">{t("roles.client")}</option>
            </select>
            {form.formState.errors.role && (
              <span className="text-xs text-red-500 mt-1.5 block">{form.formState.errors.role.message}</span>
            )}
            <p className="text-xs text-slate-400 mt-2 leading-relaxed font-light">
              {t("form.roleHint")}
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-6 flex justify-end">
            <Button 
              type="submit" 
              className="w-full sm:w-auto rounded-xl bg-slate-900 hover:bg-slate-800 text-white border-none h-11 px-8 shadow-sm transition-colors" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("buttons.creating")}
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t("buttons.submit")}
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}