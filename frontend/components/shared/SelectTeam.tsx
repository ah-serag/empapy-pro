// src/components/bookings/SelectTeam.tsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useGetTeamsSelectorQuery } from "../../redux/features/teamsApiSlice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SelectTeamProps {
  value: string | number;
  onChange: (teamId: number) => void;
  disabled?: boolean;
}

export default function SelectTeam({ value, onChange, disabled }: SelectTeamProps) {
  const t = useTranslations("SelectTeam");
  
  const { data: teams = [], isLoading, isError } = useGetTeamsSelectorQuery(undefined);

  const stringValue = value ? String(value) : "";

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
        {t("label")}
      </label>
      
      <Select
        value={stringValue}

        onValueChange={(val) => onChange(Number(val))}
        disabled={disabled || isLoading || isError}
      >
        <SelectTrigger className="w-full px-5 rounded-lg border-slate-300 shadow-none h-11 bg-white focus:ring-0">
          <SelectValue 
            placeholder={
              isLoading 
                ? t("loading") 
                : isError 
                ? t("error") 
                : t("placeholder")
            } 
          />
        </SelectTrigger>
        <SelectContent className=" border-slate-200 rounded-lg  shadow-none max-h-[200px]">
          {teams.map((team :any) => (
            <SelectItem 
              key={team.id} 
              value={String(team.id)} 
              className="cursor-pointer rounded-lg  "
            >
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}