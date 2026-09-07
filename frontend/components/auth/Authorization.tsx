"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuthorization, Role } from "@/hooks/useAuthorization";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthorizationProps {
  allow: Role[];
  children: ReactNode;
}

export default function Authorization({ allow, children }: AuthorizationProps) {
  const router = useRouter();
  
  const {
    isAuthenticated,
    hasAnyRole,
    initialized
  } = useAuthorization();

  useEffect(() => {
    if (!initialized) return;

    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    if (!hasAnyRole(allow)) {
      router.replace("/unauthorized");
    }

  }, [initialized, isAuthenticated, allow, hasAnyRole, router]);

  if (!initialized) {
    return (
      <div className="flex flex-col w-full h-[80vh] justify-center items-center gap-6 p-6">
        <Skeleton className="w-full max-w-5xl h-48 bg-slate-100 rounded-3xl" />
        <Skeleton className="w-full max-w-5xl h-64 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  if (!isAuthenticated || !hasAnyRole(allow)) {
    return null;
  }

  return <>{children}</>;
}