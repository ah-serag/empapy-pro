"use client";

import React, { useState } from "react";
import { 
  Plus, Trash2, FileText, FileSignature, 
  User, Phone, CalendarDays, Hash, ReceiptText, LayoutList 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// تأكد من مسار دالة إنشاء الـ PDF
import { generateCustomDocumentPDF } from "@/lib/pdf/pdfDocumentGenerator"; 

export default function DocumentGeneratorPage() {
  const [docType, setDocType] = useState<"invoice" | "quotation">("quotation"); 
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [docNumber, setDocNumber] = useState(`DOC-${Math.floor(1000 + Math.random() * 9000)}`);
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [discount, setDiscount] = useState<number | "">("");

  const [items, setItems] = useState([
    { id: 1, description: "", quantity: 1, price: 0 }
  ]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), description: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length === 1) return toast.error("يجب أن يحتوي المستند على صنف واحد على الأقل");
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const subTotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
  const netTotal = subTotal - Number(discount || 0);

  const handleGenerate = () => {
    if (!customerName) return toast.error("يرجى إدخال اسم العميل أو الشركة");
    if (items.some(i => !i.description || Number(i.price) <= 0)) {
      return toast.error("يرجى استكمال بيانات الأصناف (البيان والسعر)");
    }

    const documentData = {
      docType,
      customerName,
      customerPhone,
      docNumber,
      date: new Date(docDate).toLocaleDateString('ar-EG'),
      items: items.map(i => ({
        description: i.description,
        quantity: Number(i.quantity),
        price: Number(i.price),
        total: Number(i.quantity) * Number(i.price)
      })),
      subTotal,
      discount: Number(discount || 0),
      netTotal
    };

    generateCustomDocumentPDF(documentData);
  };

  return (
    <div className="min-h-screen max-w-dvw bg-slate-50/50 p-3 md:p-6 font-sans" dir="rtl">
      
      <div className=" mx-auto space-y-4 pb-20">
        
        {/* ===================== 1. Header ===================== */}
        <div className="bg-primary rounded-2xl p-4 md:p-5 border border-slate-200/60 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 shrink-0 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/20 shadow-sm">
            <FileSignature className="w-6 h-6" />
          </div>
          <div className="flex flex-col text-right">
            <h1 className="text-lg md:text-xl font-normal text-white leading-tight">إصدار مستند مالي</h1>
            <p className="text-primary-foreground/80 mt-0.5 text-[11px] md:text-[12px] font-medium">عروض أسعار وفواتير مُنسقة وجاهزة للطباعة (PDF)</p>
          </div>
        </div>

        {/* ===================== 2. نوع المستند ===================== */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/60 shadow-sm">
          <Label className="text-[13px] font-bold text-slate-800 mb-3  flex items-center gap-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px]">1</span>
            حدد نوع المستند:
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDocType("quotation")}
              className={`flex items-center justify-center gap-2 h-11 rounded-xl border text-[13px] font-bold transition-all active:scale-[0.98] ${
                docType === "quotation" 
                  ? "bg-primary/5 border-primary text-primary shadow-sm ring-1 ring-primary/20" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <LayoutList className="w-4 h-4" /> عرض سعر (Quotation)
            </button>
            
            <button
              type="button"
              onClick={() => setDocType("invoice")}
              className={`flex items-center justify-center gap-2 h-11 rounded-xl border text-[13px] font-bold transition-all active:scale-[0.98] ${
                docType === "invoice" 
                  ? "bg-primary/5 border-primary text-primary shadow-sm ring-1 ring-primary/20" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <ReceiptText className="w-4 h-4" /> فاتورة مبيعات (Invoice)
            </button>
          </div>
        </div>

        {/* ===================== 3. بيانات العميل ===================== */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/60 shadow-sm">
          <Label className="text-[13px] font-bold text-slate-800 mb-4  flex items-center gap-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px]">2</span>
            بيانات العميل والتاريخ:
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400"/> العميل / الشركة</Label>
              <Input  value={customerName} dir="rtl"  onChange={e => setCustomerName(e.target.value)} placeholder="اسم العميل..." className="h-10 text-[12px] px-4 rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-primary/20 shadow-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400"/> هاتف العميل</Label>
              <Input  value={customerPhone} dir="rtl"  onChange={e => setCustomerPhone(e.target.value)} placeholder="010..." className="h-10 text-[12px] px-4 rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-primary/20 shadow-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-slate-400"/> الرقم المرجعي</Label>
              <Input  value={docNumber} dir="rtl"   onChange={e => setDocNumber(e.target.value)} className="h-10 text-[12px] px-4 rounded-lg bg-slate-50 border-slate-200 font-mono text-left focus-visible:ring-primary/20 shadow-none transition-all"  />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-slate-400"/> التاريخ</Label>
              <Input  type="date" value={docDate} dir="rtl"  onChange={e => setDocDate(e.target.value)} className="h-10 text-[12px] px-4 rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-primary/20 shadow-none transition-all" />
            </div>
          </div>
        </div>

        {/* ===================== 4. الأصناف ===================== */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/60 shadow-sm">
          <Label className="text-[13px] font-bold text-slate-800 mb-4  flex items-center gap-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px]">3</span>
            الأصناف والخدمات المقدمة:
          </Label>
          
          <div className="space-y-3 mb-4">
            {items.map((item, index) => (
              <div key={item.id} className="relative flex flex-col lg:flex-row items-start lg:items-end gap-3 p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 transition-all hover:border-primary/30">
                
                {/* زر الحذف في الموبايل */}
                <button 
                  onClick={() => handleRemoveItem(item.id)}
                  className="absolute top-2 left-2 lg:hidden w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="hidden lg:flex flex-col space-y-1.5 w-6 pb-2.5 justify-end items-center">
                  <span className="font-bold text-slate-400 text-[11px]">{index + 1}</span>
                </div>

                <div className="w-full lg:flex-1 space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-600">البيان / الوصف</Label>
                  <Input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="اكتب وصف الخدمة أو الصنف..." className="h-10 text-[12px] px-4 rounded-lg bg-white border-slate-200 focus-visible:ring-primary/20 shadow-none transition-all" />
                </div>
                
                {/* شبكة مصغرة للكمية والسعر في الموبايل */}
                <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
                  <div className="w-full lg:w-20 space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-600">الكمية</Label>
                    <Input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="h-10 text-[12px] rounded-lg bg-white border-slate-200 text-center font-mono focus-visible:ring-primary/20 shadow-none transition-all" />
                  </div>
                  
                  <div className="w-full lg:w-28 space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-600">السعر</Label>
                    <Input type="number" min="0" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} className="h-10 text-[12px] rounded-lg bg-white border-slate-200 text-center font-mono focus-visible:ring-primary/20 shadow-none transition-all" />
                  </div>
                </div>
                
                <div className="w-full lg:w-32 space-y-1.5 mt-1 lg:mt-0">
                  <Label className="text-[11px] font-bold text-slate-600">الإجمالي</Label>
                  <div className="h-10 bg-white flex items-center justify-center rounded-lg border border-slate-200 font-bold text-primary text-[12px] font-mono shadow-sm">
                    {(Number(item.quantity) * Number(item.price)).toLocaleString()} ج.م
                  </div>
                </div>

                {/* زر الحذف في الكمبيوتر */}
                <Button 
                  variant="ghost" 
                  onClick={() => handleRemoveItem(item.id)} 
                  className="hidden lg:flex w-10 h-10 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

              </div>
            ))}
          </div>

          <Button 
            onClick={handleAddItem} 
            variant="outline" 
            className="w-full h-11 border-dashed border-2 border-slate-200 text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 rounded-xl text-[12px] font-bold transition-all"
          >
            <Plus className="w-4 h-4 ml-1.5" /> أضف صنف أو خدمة جديدة
          </Button>
        </div>

        {/* ===================== 5. الماليات والطباعة ===================== */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/60 shadow-sm">
          <Label className="text-[13px] font-bold text-slate-800 mb-4  flex items-center gap-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px]">4</span>
            مراجعة الإجماليات والطباعة:
          </Label>
          
          <div className="flex flex-col md:flex-row gap-5 items-start">
            
            {/* إدخال الخصم */}
            <div className="w-full md:w-1/2 space-y-2">
              <Label className="text-[12px] font-bold text-slate-700">قيمة الخصم (إن وجد)</Label>
              <Input 
                type="number" min="0" value={discount} 
                onChange={e => setDiscount(e.target.value === "" ? "" : Number(e.target.value))} 
                placeholder="0.00" 
                className="h-11 text-[13px] px-4 rounded-xl bg-slate-50 border-slate-200 font-mono text-left focus-visible:ring-primary/20 shadow-none transition-all" 
                dir="ltr"
              />
              <p className="text-[10px] text-slate-400 text-right font-medium">أدخل قيمة الخصم ليتم طرحها من الإجمالي مباشرة.</p>
            </div>

            {/* الإجماليات وزر الطباعة */}
            <div className="w-full md:w-1/2 flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-[12px]">
                <span className="font-bold text-slate-600">الإجمالي قبل الخصم</span>
                <span className="font-bold font-mono text-slate-800">{subTotal.toLocaleString()} ج.م</span>
              </div>
              
              {Number(discount) > 0 && (
                <div className="flex justify-between items-center text-[12px]">
                  <span className="font-bold text-rose-500">قيمة الخصم</span>
                  <span className="font-bold font-mono text-rose-600">- {Number(discount).toLocaleString()} ج.م</span>
                </div>
              )}
              
              <div className="bg-primary rounded-xl p-3.5 mt-1 shadow-inner border border-primary/20 flex flex-col justify-center items-center text-center">
                <span className="block text-primary-foreground/80 text-[10px] font-bold mb-0.5">الصافي النهائي للمستند</span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-bold font-mono text-xl text-white">{netTotal.toLocaleString()}</span>
                  <span className="text-[11px] font-bold text-white/70">ج.م</span>
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                className="w-full h-11 mt-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-[13px] shadow-md transition-all active:scale-[0.98]"
              >
                <FileText className="w-4 h-4 ml-1.5" />
                إنشاء وطباعة المستند
              </Button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}