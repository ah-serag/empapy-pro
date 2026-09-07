"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

import { bookingSchema, BookingFormValues } from "@/lib/validation/bookingSchema";
import { useCreateBookingMutation } from "@/redux/features/bookingApiSlice";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Phone, Mail, MapPin, Map } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import LocationSelector from "@/components/shared/LocationSelector";

interface CreateBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const inputStyles = "h-11 bg-slate-50/50 border-slate-200 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-secondary/20 focus-visible:border-secondary transition-colors shadow-sm rounded-xl text-slate-900 placeholder:text-slate-400";

export default function CreateBookingModal({ open, onOpenChange }: CreateBookingModalProps) {
  const [createBooking, { isLoading: isCreating }] = useCreateBookingMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      source: "internal_system",
    },
  });

  const selectedDate = watch("preferred_date");
  const selectedGovId = watch("gov_id");
  const selectedZoneId = watch("zone_id");

  useEffect(() => {
    if (open) {
      setValue("source", "internal_system");
    }
  }, [open, setValue]);

  const onSubmitCreate = async (data: BookingFormValues) => {
    try {
      await createBooking(data).unwrap();
      toast.success("Booking created successfully");
      onOpenChange(false);
      reset(); 
    } catch (error) {
      console.error("Failed to submit booking:", error);
      toast.error("Failed to create booking. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* نقلنا الـ overflow إلى الـ form والـ container الداخلي لتصبح الهيدر ثابتة وليست العشوائية للخارج */}
      <DialogContent className="sm:max-w-[700px] w-[95vw] p-0 rounded-2xl shadow-2xl border-slate-200 bg-white max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header ثابت لا يتحرك مع الـ Scroll */}
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-light w-full p-6 bg-secondary text-white text-xl rounded-t-2xl">
            Create New Booking
          </DialogTitle>
        </DialogHeader>

        {/* الـ Container الداخلي مع Scroll احترافي و Padding منسق (px) */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-5 pb-4">
            
            {/* Name & Phone Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 px-0.5">
                <label className="text-xs font-semibold text-slate-700 block px-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input 
                  {...register("contact_name")} 
                  placeholder="e.g. Ahmed Ali" 
                  className={cn(inputStyles, "ps-3", errors.contact_name && "border-red-500")} 
                />
                {errors.contact_name && <p className="text-[10px] font-medium text-red-500 px-1">{errors.contact_name.message}</p>}
              </div>

              <div className="space-y-1.5 px-0.5">
                <label className="text-xs font-semibold text-slate-700 block px-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Phone className="absolute start-3 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                  <Input 
                    {...register("contact_phone")} 
                    placeholder="e.g. 010xxxxxxxx" 
                    className={cn(inputStyles, "ps-10", errors.contact_phone && "border-red-500")} 
                  />
                </div>
                {errors.contact_phone && <p className="text-[10px] font-medium text-red-500 px-1">{errors.contact_phone.message}</p>}
              </div>
            </div>

            {/* Email Row */}
            <div className="space-y-1.5 px-0.5">
              <label className="text-xs font-semibold text-slate-700 block px-1">
                Email <span className="text-slate-400 font-normal ml-1">(Optional)</span>
              </label>
              <div className="relative group">
                <Mail className="absolute start-3 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                <Input 
                  {...register("contact_email")} 
                  placeholder="client@example.com" 
                  className={cn(inputStyles, "ps-10", errors.contact_email && "border-red-500")} 
                />
              </div>
              {errors.contact_email && <p className="text-[10px] font-medium text-red-500 px-1">{errors.contact_email.message}</p>}
            </div>

            {/* Location Selector */}
            <div className="px-0.5">
               <LocationSelector 
                 selectedGovId={selectedGovId}
                 selectedZoneId={selectedZoneId}
                 onGovChange={(id) => setValue("gov_id", id, { shouldValidate: true })}
                 onZoneChange={(id) => setValue("zone_id", id, { shouldValidate: true })}
                 govError={errors.gov_id?.message}
                 zoneError={errors.zone_id?.message}
               />
            </div>

            {/* Address Row */}
            <div className="space-y-1.5 px-0.5">
              <label className="text-xs font-semibold text-slate-700 block px-1">
                Detailed Address <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <MapPin className="absolute start-3 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                <Input 
                  {...register("address")} 
                  placeholder="Street name, building number..." 
                  className={cn(inputStyles, "ps-10", errors.address && "border-red-500")} 
                />
              </div>
              {errors.address && <p className="text-[10px] font-medium text-red-500 px-1">{errors.address.message}</p>}
            </div>

            {/* Location URL Row */}
            <div className="space-y-1.5 px-0.5">
              <label className="text-xs font-semibold text-slate-700 block px-1">
                Location URL <span className="text-slate-400 font-normal ml-1">(Optional)</span>
              </label>
              <div className="relative group">
                <Map className="absolute start-3 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                <Input 
                  {...register("location_url")} 
                  placeholder="Google Maps link" 
                  className={cn(inputStyles, "ps-10", errors.location_url && "border-red-500")} 
                />
              </div>
              {errors.location_url && <p className="text-[10px] font-medium text-red-500 px-1">{errors.location_url.message}</p>}
            </div>

            {/* Date Row */}
            <div className="w-full md:w-1/2 px-0.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block px-1">
                  Preferred Date <span className="text-red-500">*</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        inputStyles,
                        "w-full justify-start text-left font-normal pl-3",
                        !selectedDate && "text-slate-400",
                        errors.preferred_date && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-4 w-4 text-slate-400" />
                      {selectedDate ? (
                        <span className="text-slate-900">{format(selectedDate, "PPP")}</span>
                      ) : (
                        <span>Select a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl border-slate-200 shadow-xl bg-white" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setValue("preferred_date", date, { shouldValidate: true });
                        }
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="p-3"
                    />
                  </PopoverContent>
                </Popover>
                {errors.preferred_date && <p className="text-[10px] font-medium text-red-500 px-1">{errors.preferred_date.message}</p>}
              </div>
            </div>

            {/* Notes Row */}
            <div className="space-y-1.5 w-full px-0.5">
              <label className="text-xs font-semibold text-slate-700 block px-1">
                Notes <span className="text-slate-400 font-normal ml-1">(Optional)</span>
              </label>
              <Textarea 
                {...register("notes")}
                maxLength={250}
                placeholder="Any specific requests or details..." 
                className={cn(
                  inputStyles, 
                  "ps-3 h-24 py-3 max-w-full resize-none rounded-xl", 
                  "break-words whitespace-pre-wrap overflow-y-auto", 
                  errors.notes && "border-red-500"
                )} 
              />
              {errors.notes && <p className="text-[10px] font-medium text-red-500 px-1">{errors.notes.message}</p>}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6 flex justify-end gap-3 px-0.5">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl shadow-sm border-slate-200 h-11 px-5"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating}
                className="bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-sm h-11 px-6 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCreating ? "Saving..." : "Create Booking"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}