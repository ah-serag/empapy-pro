"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCreateInvoiceMutation } from "@/redux/features/invoicesApiSlice"; 
import { Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

import { createInvoiceSchema } from "@/lib/validation/invoice.schema";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: number | null;
  issuedBy: number | undefined;
}

const inputStyles = "h-11 bg-slate-50/50 border-slate-200 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-colors shadow-sm rounded-xl text-slate-900 placeholder:text-slate-400 px-4";

export default function CreateInvoiceModal({ isOpen, onClose, assignmentId, issuedBy }: CreateInvoiceModalProps) {
  const t = useTranslations("assignments.invoices"); 
  const [createInvoice, { isLoading }] = useCreateInvoiceMutation();

  const [formData, setFormData] = useState({
    subtotal: "",
    discount: "", 
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const handleClose = () => {
    setFormErrors({});
    setFormData({ subtotal: "", discount: "", notes: "" });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    if (!assignmentId || !issuedBy) {
      toast.error(t("errors.missing_data"));
      return;
    }

    const validationResult = createInvoiceSchema.safeParse(formData);

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        errors[fieldName] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    try {
      await createInvoice({
        assignment_id: assignmentId,
        issued_by: issuedBy,
        subtotal: validationResult.data.subtotal,
        discount: validationResult.data.discount,
        notes: validationResult.data.notes,
      }).unwrap();

      toast.success(t("success.created"));
      handleClose();
    } catch (err: any) {
      toast.error(err?.data?.message || t("errors.generic_error"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-[450px] w-[95vw] p-0 rounded-2xl shadow-2xl border-slate-200 bg-white overflow-hidden">
        
        <DialogHeader className="bg-secondary p-6 m-0 rounded-t-2xl">
          <DialogTitle className="font-light text-xl text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-300" />
            {t("modal.title")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subtotal" className={`text-xs font-semibold block ${formErrors.subtotal ? "text-red-500" : "text-slate-700"}`}>
              {t("modal.subtotal_label")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subtotal"
              name="subtotal"
              type="number"
              min={1}
              placeholder={t("modal.subtotal_placeholder")}
              value={formData.subtotal}
              onChange={handleChange}
              className={cn(
                inputStyles,
                formErrors.subtotal ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200" : ""
              )}
            />
            {formErrors.subtotal && <p className="text-[10px] font-medium text-red-500 px-1">{formErrors.subtotal}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="discount" className={`text-xs font-semibold block ${formErrors.discount ? "text-red-500" : "text-slate-700"}`}>
              {t("modal.discount_label")}
            </Label>
            <Input
              id="discount"
              name="discount"
              type="number"
              min={0}
              placeholder={t("modal.discount_placeholder")}
              value={formData.discount}
              onChange={handleChange}
              className={cn(
                inputStyles,
                formErrors.discount ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200" : ""
              )}
            />
            {formErrors.discount && <p className="text-[10px] font-medium text-red-500 px-1">{formErrors.discount}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold text-slate-700 block">
              {t("modal.notes_label")} <span className="text-slate-400 font-normal ml-1">(Optional)</span>
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder={t("modal.notes_placeholder")}
              value={formData.notes}
              onChange={handleChange}
              className={cn(
                inputStyles,
                "h-24 py-3 resize-none rounded-xl",
                "break-words whitespace-pre-wrap overflow-y-auto"
              )}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t border-slate-100 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              disabled={isLoading}
              className="rounded-xl shadow-sm border-slate-200 bg-white hover:bg-slate-50 text-slate-700 w-full sm:w-auto h-11"
            >
              {t("modal.cancel")}
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="rounded-xl shadow-sm bg-secondary hover:bg-slate-800 text-white w-full sm:w-auto h-11 transition-colors"
            >
              {isLoading ? t("modal.loading") : t("modal.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}