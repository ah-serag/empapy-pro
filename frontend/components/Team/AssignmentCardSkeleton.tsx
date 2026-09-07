import { Skeleton } from "@/components/ui/skeleton";

export function AssignmentCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg shadow-sm bg-white flex flex-col gap-3 mb-3" dir="rtl">
      {/* Header Skeleton */}
      <div className="flex justify-between bg-slate-100 rounded-t-lg p-4 items-center h-14">
        <Skeleton className="h-5 w-32 bg-slate-200" />
        <Skeleton className="h-8 w-8 rounded-md bg-slate-200" />
      </div>

      {/* Body Skeleton */}
      <div className="flex flex-col p-4 gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full bg-slate-200" />
          <Skeleton className="h-4 w-40 bg-slate-200" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full bg-slate-200" />
          <Skeleton className="h-4 w-24 bg-slate-200" />
        </div>
        <div className="flex items-start gap-2 mt-1">
          <Skeleton className="h-4 w-4 rounded-full bg-slate-200 shrink-0" />
          <div className="space-y-2 w-full">
            <Skeleton className="h-4 w-full bg-slate-200" />
            <Skeleton className="h-4 w-2/3 bg-slate-200" />
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="mt-2 p-4 pt-2 border-t border-gray-100">
        <Skeleton className="h-10 w-full rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}