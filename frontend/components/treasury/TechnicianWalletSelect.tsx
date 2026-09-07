import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wallet } from "lucide-react";
import { useGetTechnicianWalletsQuery } from "@/redux/features/treasurySafesApiSlice";

interface TechnicianWalletSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

interface WalletData {
  id: number;
  name: string;
  balance: string | number;
  user_id: number;
  technician_name: string;
}

export function TechnicianWalletSelect({ value, onChange, required = true }: TechnicianWalletSelectProps) {
  const { data: response, isLoading, isError } = useGetTechnicianWalletsQuery(undefined);
  const wallets: WalletData[] = response?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center h-11 px-3 border rounded-md bg-slate-50 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" /> جاري تحميل عهد الفنيين...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center h-11 px-3 border border-red-200 rounded-md bg-red-50 text-sm text-red-500">
        خطأ في تحميل بيانات العهد
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} required={required}>
      <SelectTrigger className="h-11 px-4 border-slate-200 focus:ring-blue-500">
        <SelectValue placeholder="اختر خزنة العهدة الممول منها..." />
      </SelectTrigger>
      <SelectContent dir="rtl">
        {wallets.length === 0 ? (
          <div className="p-3 text-sm text-slate-500 text-center">لا توجد عهد فنيين نشطة حالياً</div>
        ) : (
          wallets.map((wallet) => (
            <SelectItem key={wallet.id} value={wallet.id.toString()}>
              <div className="flex items-center gap-2 justify-between w-full pr-2">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <Wallet className="w-4 h-4 text-blue-800" /> {wallet.name}
                </span>
                <span className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded-md ml-4 border border-blue-100">
                  رصيد: <b className="font-bold">{wallet.balance}</b> ج.م
                </span>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}