"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, LogIn, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { toast } from "sonner"

import { signInSchema, SignInFormValues } from "@/lib/validation/authShema"
import { useSignInMutation } from "@/redux/features/authApiSlice"

import { useLazyGetUserAccountInfoQuery } from "@/redux/features/account" 

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link, useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

export default function SignInPage() {
  const router = useRouter()
  
  const [signIn, { isLoading: isSigningIn }] = useSignInMutation()
  const [fetchUserInfo] = useLazyGetUserAccountInfoQuery()
  
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showPassword, setShowPassword] = useState(false) 

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  const isBusy = isSigningIn || isRedirecting

  const onSubmit = async (values: SignInFormValues) => {
    try {
      setIsRedirecting(true) 
      
      // 1. تسجيل الدخول
      const response = await signIn(values).unwrap()
      
      // 2. جلب بيانات الحساب وتحديث الريدكس قبل التوجيه
      // 🔴 تم إضافة undefined هنا لحل خطأ TypeScript
      try {
        await fetchUserInfo(undefined).unwrap() 
      } catch (userErr) {
        console.error("Failed to fetch user info during login", userErr)
      }

      // 3. تحديث مسارات Next.js
      router.refresh()

      toast.success(response.message || "Login successful")
      
      // 4. التوجيه بناءً على الصلاحية
      setTimeout(() => {
        const roleUser = response?.user?.role;
        switch(roleUser){
          case "client":
            router.push("/"); 
            break;
          case "superadmin":
          case "admin":
            router.push("/manager"); 
            break;
          case "supervisor":
            router.push("/team"); 
            break;
          default: 
            router.push("/"); 
        }
      }, 300)

    } catch (err: any) {
      setIsRedirecting(false)
      if (err?.data?.message) {
        toast.error(err?.data?.message)
      } else {
        toast.error("An error occurred during sign in.")
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4 sm:p-8 font-sans selection:bg-primary/10 relative overflow-hidden">
      
      {/* تأثيرات جمالية خفيفة في الخلفية */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      {/* ================= Card Container ================= */}
      <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-8 sm:p-10 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-primary/5 border border-primary/10 flex items-center justify-center rounded-[1.2rem] mb-6 shadow-sm">
            <LogIn className="w-7 h-7 text-primary" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-[13px] text-slate-500 mt-2.5 font-medium leading-relaxed">
            Enter your credentials to access your secure account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 block">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-300">
                <Mail size={18} strokeWidth={2.5} />
              </div>
              <Input 
                type="email" 
                placeholder="name@example.com" 
                {...form.register("email")} 
                disabled={isBusy}
                className={cn(
                  "w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50/80 border-slate-200/60 text-slate-900 font-bold text-[13px] transition-all duration-300 shadow-sm",
                  "focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10",
                  "hover:border-slate-300 disabled:opacity-50"
                )}
              />
            </div>
            {form.formState.errors.email && (
              <span className="text-[11px] font-bold text-rose-500 ml-1 block mt-1">
                • {form.formState.errors.email.message}
              </span>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 block">
              Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors duration-300">
                <Lock size={18} strokeWidth={2.5} />
              </div>
              
              {/* حقل الإدخال */}
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                {...form.register("password")} 
                disabled={isBusy}
                className={cn(
                  "w-full h-12 pl-12 pr-12 rounded-xl bg-slate-50/80 border-slate-200/60 text-slate-900 font-bold text-[13px] transition-all duration-300 shadow-sm",
                  "focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10",
                  "hover:border-slate-300 disabled:opacity-50"
                )}
              />
              
              {/* 👁️ زر إظهار/إخفاء كلمة المرور */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 focus:outline-none rounded-lg hover:bg-slate-100 transition-colors"
                tabIndex={-1} // لعدم التركيز عليه بالـ Tab
              >
                {showPassword ? (
                  <EyeOff size={16} strokeWidth={2.5} />
                ) : (
                  <Eye size={16} strokeWidth={2.5} />
                )}
              </button>
            </div>
            
            {form.formState.errors.password && (
              <span className="text-[11px] font-bold text-rose-500 ml-1 block mt-1">
                • {form.formState.errors.password.message}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isBusy}
            className="w-full h-12 mt-8 rounded-xl bg-primary hover:bg-primary/90 text-white border-gray-500 text-[14px] font-bold shadow-lg shadow-primary/25 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isBusy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-white/80" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} className="text-white/80" strokeWidth={2.5} />
              </>
            )}
          </Button>

        </form>

        {/* Footer */}
   
      </div>
    </div>
  )
}