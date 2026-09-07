"use client"

import React from "react"
import { useGetGovernoratesAndZonesQuery } from "@/redux/features/locationsApiSlice"
import { Governorate } from "@/lib/validation/locationsSchema"
import { useTranslations } from "next-intl" 
import { cn } from "@/lib/utils"

interface LocationSelectorProps {
  selectedGovId: number | null;
  selectedZoneId: number | null;
  onGovChange: (id: number) => void;
  onZoneChange: (id: number) => void;
  govError?: string;
  zoneError?: string;
}

const selectStyles = "flex h-11 w-full border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-slate-900 disabled:bg-slate-100 disabled:opacity-50";

export default function LocationSelector({ 
  selectedGovId, 
  selectedZoneId, 
  onGovChange, 
  onZoneChange,
  govError,
  zoneError
}: LocationSelectorProps) {
  
  const t = useTranslations("Locations");

  const { data, isLoading } = useGetGovernoratesAndZonesQuery({})
  const governorates: Governorate[] = data?.data || []

  const availableZones = selectedGovId 
    ? governorates.find(g => g.id === selectedGovId)?.zones?.filter(z => z.is_active) || []
    : [];

  if (isLoading) {
    return <div className="text-sm text-slate-400 font-light animate-pulse py-2">{t("loading")}</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. قائمة المحافظات */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 block">
          {t("governorate")} <span className="text-red-500">*</span>
        </label>
        <select 
          className={cn(selectStyles, govError && "border-red-500")}
          value={selectedGovId || 0}
          onChange={(e) => {
            const govId = Number(e.target.value);
            onGovChange(govId);
            onZoneChange(0); 
          }}
        >
          <option value={0} disabled>{t("selectGovernorate")}</option>
          {governorates.filter(g => g.is_active).map(gov => (
            <option key={gov.id} value={gov.id}>
              {gov.name_en} - {gov.name_ar}
            </option>
          ))}
        </select>
        {govError && <span className="text-[10px] font-medium text-red-500 mt-1 block">{govError}</span>}
      </div>

      {/* 2. قائمة المراكز/المناطق */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 block">
          {t("zone")} <span className="text-red-500">*</span>
        </label>
        <select 
          className={cn(selectStyles, zoneError && "border-red-500" )}
          value={selectedZoneId || 0}
          onChange={(e) => onZoneChange(Number(e.target.value))}
          disabled={!selectedGovId || availableZones.length === 0}
        >
          <option value={0} disabled>
            {!selectedGovId 
              ? t("selectGovernorateFirst") 
              : availableZones.length === 0 
                ? t("noZonesAvailable") 
                : t("selectZone")}
          </option>
          {availableZones.map(zone => (
            <option className="rounded-lg "  key={zone.id} value={zone.id}>
              {zone.name_en} - {zone.name_ar}
            </option>
          ))}
        </select>
        {zoneError && <span className="text-[10px] font-medium text-red-500 mt-1 block">{zoneError}</span>}
      </div>
    </div>
  )
}