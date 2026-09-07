"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useGetPurchaseInvoiceDetailsQuery } from "@/redux/features/purchaseApiSlice";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button"; 
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Receipt, Building2, Wallet, Calendar, User, 
  FileText, Package, Banknote, Printer, History, CheckCircle2 
} from "lucide-react";

import InvoicePaymentModal from "./InvoicePaymentModal";
import { generatePurchaseInvoicePDF } from "@/lib/pdf/PurchaseInvoicePDF"; 

interface InvoiceDetailsModalProps {
  invoiceId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InvoiceDetailsModal({ invoiceId, open, onOpenChange }: InvoiceDetailsModalProps) {
  const t = useTranslations("invoicesManager");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: response, isLoading, isError } = useGetPurchaseInvoiceDetailsQuery(invoiceId, {
    skip: !invoiceId || !open,
  });

  const invoice = response?.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID": return <Badge className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold text-[10px] sm:text-[11px]">{t("filters.paid")}</Badge>;
      case "PARTIALLY_PAID": return <Badge className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200 font-bold text-[10px] sm:text-[11px]">{t("filters.partially_paid")}</Badge>;
      case "UNPAID": return <Badge className="bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200 font-bold text-[10px] sm:text-[11px]">{t("filters.unpaid")}</Badge>;
      default: return null;
    }
  };

  const remainingAmount = invoice ? Number(invoice.net_amount) - Number(invoice.paid_amount) : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-[550px] w-[95vw] h-[90vh] flex flex-col p-0 gap-0 border-0 rounded-2xl bg-slate-50 shadow-2xl overflow-hidden" 
          dir="rtl"
        >
          
          <div className="bg-primary border-b border-slate-100 px-4 py-3 flex justify-between items-center shrink-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-primary flex items-center justify-center shrink-0">
                <Receipt size={16} />
              </div>
              <div className="flex flex-col">
                <DialogTitle className="font-bold text-[13px] sm:text-[14px] text-slate-100 tracking-tight text-right">
                  {invoice?.invoice_ref || "جاري التحميل..."}
                </DialogTitle>
                {invoice?.invoice_date && (
                  <span className="text-[10px] sm:text-[11px] text-slate-200 font-medium flex items-center gap-1 mt-0.5">
                    <Calendar size={10} /> {new Date(invoice.invoice_date).toLocaleDateString("en-GB")}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {invoice && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generatePurchaseInvoicePDF(invoice)}
                  className="hidden sm:flex rounded-lg h-7 px-3 font-bold text-slate-600 hover:text-slate-900 border-slate-200 bg-white shadow-sm text-[11px]"
                >
                  <Printer size={12} className="ml-1" /> طباعة
                </Button>
              )}
              {invoice?.payment_status && getStatusBadge(invoice.payment_status)}
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0 w-full bg-slate-50/50" dir="rtl">
            <div className="p-3 sm:p-4 flex flex-col gap-3.5">
              
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : isError || !invoice ? (
                <div className="flex items-center justify-center h-[300px] text-[12px] text-rose-500 font-bold bg-white rounded-xl shadow-sm border border-slate-100">
                  حدث خطأ أثناء تحميل بيانات الفاتورة
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2 text-right">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-start gap-1">
                        <Building2 size={12} className="text-slate-300" /> {t("modal.supplierInfo")}
                      </h3>
                      <div>
                        <p className="font-bold text-[13px] text-slate-800">{invoice.supplier_name}</p>
                        {invoice.supplier_company && <p className="text-[11px] text-slate-500 mt-0.5">{invoice.supplier_company}</p>}
                        {invoice.supplier_invoice_number && (
                          <div className="mt-2 flex items-center gap-1.5 justify-start">
                            <span className="text-[10px] font-bold text-slate-400">الرقم الورقي:</span>
                            <span className="text-[10px] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-600" dir="ltr">
                              {invoice.supplier_invoice_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2 text-right">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-start gap-1">
                        <Wallet size={12} className="text-slate-300" /> {t("modal.financials")}
                      </h3>
                      <div className="flex flex-col gap-1.5 pt-1">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>{t("modal.total")}:</span>
                          <span className="font-mono text-slate-700">{Number(invoice.total_amount).toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>{t("modal.discount")}:</span>
                          <span className="font-mono text-rose-500">-{Number(invoice.discount).toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center text-[12px] font-bold text-slate-800 pt-1.5 border-t border-slate-50">
                          <span>الصافي المطلوب:</span>
                          <span className="font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">{Number(invoice.net_amount).toLocaleString()} ج.م</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {invoice.items && invoice.items.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                      <div className="px-3.5 py-2.5 flex items-center gap-1.5 border-b border-slate-50 text-right">
                        <Package size={14} className="text-slate-400" />
                        <h3 className="text-[12px] font-bold text-slate-800">{t("modal.itemsTitle")}</h3>
                      </div>
                      <div className="flex flex-col p-2.5 gap-2.5 bg-slate-50/50">
                        {invoice.items.map((item: any) => (
                          <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-100 flex flex-col gap-2">
                            <div className="flex justify-between items-start border-b border-slate-50 pb-2">
                              <span className="font-bold text-[12px] text-slate-700">{item.material_name}</span>
                              <span className="font-mono font-bold text-[12px] text-slate-800">{Number(item.total_price).toLocaleString()} ج.م</span>
                            </div>
                            <div className="flex flex-wrap justify-between items-center text-[10px] sm:text-[11px] text-slate-500 gap-2">
                              <span className="flex gap-1 items-center">
                                <span>SKU:</span>
                                <span className="font-mono" dir="ltr">{item.material_sku || '-'}</span>
                              </span>
                              <span className="flex gap-1 items-center">
                                <span>{t("modal.qty")}:</span>
                                <span className="font-mono font-bold text-slate-700">{Number(item.quantity)}</span>
                              </span>
                              <span className="flex gap-1 items-center">
                                <span>{t("modal.price")}:</span>
                                <span className="font-mono">{Number(item.unit_price).toLocaleString()}</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {invoice.payments && invoice.payments.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden text-right flex flex-col">
                      <div className="px-3.5 py-2.5 flex items-center gap-1.5 border-b border-slate-50">
                        <History size={14} className="text-slate-400" />
                        <h3 className="text-[12px] font-bold text-slate-800">سجل الدفعات</h3>
                      </div>
                      <div className="p-2.5 flex flex-col gap-2.5 bg-slate-50/50">
                        {invoice.payments.map((payment: any) => (
                          <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-white border border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={14} />
                              </div>
                              <div className="flex flex-col">
                                <p className="text-[11px] font-bold text-slate-800">دفعة نقدية</p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] sm:text-[10px] text-slate-500 mt-0.5">
                                  <span className="flex items-center gap-0.5"><Calendar size={9}/> {new Date(payment.created_at).toLocaleDateString("en-GB")}</span>
                                  {payment.safe_name && <span className="flex items-center gap-0.5"><Wallet size={9}/> {payment.safe_name}</span>}
                                  {payment.created_by_name && <span className="flex items-center gap-0.5"><User size={9}/> {payment.created_by_name}</span>}
                                </div>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-[12px] text-emerald-600 self-end sm:self-auto" dir="ltr">
                              {Number(payment.amount).toLocaleString()} ج.م
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {invoice.notes && (
                    <div className="flex items-start gap-2 max-w-full text-right bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <FileText size={14} className="text-slate-300 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {invoice.notes}
                      </p>
                    </div>
                  )}

                  <div className="bg-primary rounded-xl p-4 text-white flex flex-col sm:flex-row justify-between items-center gap-4 shadow-md text-right mt-1">
                    <div className="flex justify-between w-full sm:w-auto gap-4 sm:gap-6">
                      <div className="flex flex-col">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">{t("table.paid")}</p>
                        <p className="text-[14px] font-mono font-bold text-slate-100">{Number(invoice.paid_amount).toLocaleString()} ج</p>
                      </div>
                      <div className="pl-0 sm:pl-6 border-r-0 sm:border-r border-slate-700">
                        <p className="text-[9px] pr-0 sm:pr-6 text-slate-400 uppercase tracking-widest mb-0.5">المتبقي الآجل</p>
                        <p className="text-[14px] pr-0 sm:pr-6 font-mono font-bold text-red-200">
                          {remainingAmount.toLocaleString()} ج
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-full sm:w-auto">
                      {(invoice.payment_status === "UNPAID" || invoice.payment_status === "PARTIALLY_PAID") ? (
                        <Button 
                          onClick={() => setIsPaymentModalOpen(true)}
                          className="h-9 px-4 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-bold w-full sm:w-auto shadow-sm text-[11px]"
                        >
                          <Banknote className="w-3.5 h-3.5 ml-1.5" /> سداد دفعة
                        </Button>
                      ) : (
                        <div className="h-9 px-4 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center justify-center w-full sm:w-auto text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" /> مسددة بالكامل
                        </div>
                      )}
                    </div>
                  </div>

                </>
              )}
            </div>
          </ScrollArea>

          <div className="bg-white border-t border-slate-100 px-4 py-3 flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-2.5 shrink-0 z-10">
            {invoice && (
              <Button 
                variant="outline" 
                onClick={() => generatePurchaseInvoicePDF(invoice)}
                className="sm:hidden w-full rounded-lg h-9 font-bold text-slate-600 border-slate-200 bg-white text-[11px]"
              >
                <Printer size={14} className="ml-1" /> طباعة
              </Button>
            )}

            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto rounded-lg h-9 px-6 font-bold text-slate-600 hover:bg-slate-100 border-slate-200 bg-white text-[11px] transition-all"
            >
              إغلاق
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      {invoice && (
        <InvoicePaymentModal 
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          invoiceId={invoice.id}
          invoiceRef={invoice.invoice_ref}
          remainingAmount={remainingAmount}
        />
      )}
    </>
  );
}