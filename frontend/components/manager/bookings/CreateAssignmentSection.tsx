// src/components/bookings/CreateAssignmentDialog.tsx
"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import SelectTeam from "../../shared/SelectTeam";
import { useCreateAssignmentMutation } from "../../../redux/features/assignmentsApiSlice"; 

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface CreateAssignmentDialogProps {
  booking_id: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateAssignmentDialog({ 
  booking_id, 
  open, 
  onOpenChange 
}: CreateAssignmentDialogProps) {
  const t = useTranslations("ViewBookingModal");

  const [teamId, setTeamId] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");

  const [createAssignment, { isLoading: isCreatingAssignment }] = useCreateAssignmentMutation();

  const handleCreateAssignment = async () => {
    if (!teamId || !booking_id) {
      toast.error("يرجى التأكد من اختيار الفريق وتوفر رقم الحجز.");
      return;
    }

    try {
      await createAssignment({
        booking_id: Number(booking_id), 
        team_id: Number(teamId),
        notes: assignmentNotes,
      }).unwrap();

      toast.success("تم تعيين الفريق للحجز بنجاح!");
      
      setTeamId("");
      setAssignmentNotes("");
      onOpenChange(false);

    } catch (error : any) {
      const errorMessage = error?.data?.message || "حدث خطأ غير متوقع أثناء التعيين.";
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] rounded-2xl border-slate-200 shadow-2xl bg-white p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-slate-100 bg-secondary">
          <DialogTitle className="text-lg font-light text-white flex items-center gap-2">
            {t("assignment")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="w-full">
              <SelectTeam
                value={teamId}
                onChange={(val: any) => setTeamId(String(val))}
                disabled={isCreatingAssignment}
              />
            </div>

            <div className="w-full">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                {t("assignmentNotes")}
              </label>
              <textarea
                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:outline-none focus:border-secondary min-h-[100px] resize-none rounded-xl shadow-sm"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder={t("enterNotes")}
              />
            </div>
          </div>
          
          <Button
            onClick={handleCreateAssignment}
            disabled={!teamId || isCreatingAssignment}
            className="w-full bg-secondary text-white hover:bg-secondary/90 h-11 rounded-xl shadow-sm transition-colors"
          >
            {isCreatingAssignment ? t("creating") : t("createAssignment")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}