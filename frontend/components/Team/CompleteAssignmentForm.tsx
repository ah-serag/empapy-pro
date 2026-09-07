"use client";

import React, { useState, useRef, useMemo } from 'react'; 
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { 
  Plus, Minus, X, Search, Trash2, Loader2, AlertCircle, 
  Camera, FileText, Package, Banknote, Wrench, Users, QrCode, Calculator, ImagePlus,
  Sigma
} from 'lucide-react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import imageCompression from 'browser-image-compression';
import { 
  useCompleteAssignmentMutation, 
  useGetActiveServicesListQuery, 
  useLazySearchActiveMembersQuery,
  useLazySearchMaterialsForExecutionQuery
} from '@/redux/features/TeamApiSlice';
import { completeAssignmentSchema, CompleteAssignmentFormValues } from '@/lib/validation/completeAssignments';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

export interface Member { user_id: number; name: string; }
export interface Service { id: number; name_ar: string; base_price: string; }

interface CompleteAssignmentFormProps {
  assignmentId: number;
  initialMembers: Member[];
  onClose: () => void;
}

export default function CompleteAssignmentForm({ assignmentId, initialMembers, onClose }: CompleteAssignmentFormProps) {

  const { data: servicesResponse } = useGetActiveServicesListQuery(undefined);
  const [searchMemberTrigger, { data: searchResults, isFetching: isSearching }] = useLazySearchActiveMembersQuery();
  const [searchMaterialTrigger, { data: materialResults, isFetching: isSearchingMaterials }] = useLazySearchMaterialsForExecutionQuery();
  const [completeAssignment, { isLoading: isSubmitting }] = useCompleteAssignmentMutation();

  const servicesList: Service[] = servicesResponse?.data || [];
  const activeSearchResults: Member[] = searchResults?.data || [];
  const activeMaterialResults: any[] = materialResults?.data || [];

  const { 
    control, 
    handleSubmit, 
    setValue, 
    getValues, 
    formState: { errors, isValid } 
  } = useForm<CompleteAssignmentFormValues>({
    resolver: zodResolver(completeAssignmentSchema),
    mode: 'onChange',
    defaultValues: {
      members: initialMembers.map(m => ({ user_id: m.user_id, name: m.name || `فني ${m.user_id}` })),
      services: [{ service_id: "", quantity: 1 }]
    }
  });

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control,
    name: "services"
  });

  //  استخدمنا useWatch لضمان التحديث اللحظي الدقيق (حل مشكلة تأخر ظهور السعر)
  const watchedMembers = useWatch({ control, name: "members", defaultValue: getValues("members") });
  const watchedServices = useWatch({ control, name: "services", defaultValue: getValues("services") });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [materialSearchTerm, setMaterialSearchTerm] = useState<string>('');
  const [selectedMaterials, setSelectedMaterials] = useState<any[]>([]);
  const [techNotes, setTechNotes] = useState<string>("");

  //  فصل حالات الصور لـ (قبل) و (بعد)
  const [beforePhotos, setBeforePhotos] = useState<{ file: File, preview: string }[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<{ file: File, preview: string }[]>([]);
  
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);

  // حالات الدفع والمصروفات
  const [paymentMethod, setPaymentMethod] = useState<'NONE' | 'CASH' | 'TRANSFER'>('NONE');
  const [collectedAmount, setCollectedAmount] = useState<string>("");
  const [hasExpenses, setHasExpenses] = useState<boolean>(false);
  const [additionalExpenses, setAdditionalExpenses] = useState<string>("");
  const [expensesReason, setExpensesReason] = useState<string>("");

  const [serialInput, setSerialInput] = useState<{ [key: string]: string }>({});

  //  الحساب اللحظي المتقن للمبلغ المطلوب
  const calculatedTotalAmount = useMemo(() => {
    let total = 0;
    
    // حساب الخدمات
    watchedServices.forEach(srv => {
      if (srv.service_id) {
        const foundService = servicesList.find(s => String(s.id) === String(srv.service_id));
        if (foundService && foundService.base_price) {
          total += (Number(foundService.base_price) * Number(srv.quantity || 1));
        }
      }
    });

    // حساب الخامات
    selectedMaterials.forEach(mat => {
      if (mat.current_price) {
        total += (Number(mat.current_price) * Number(mat.selectedQty || 1));
      }
    });

    return total;
  }, [watchedServices, selectedMaterials, servicesList]);


  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val.trim().length > 2) searchMemberTrigger(val); 
  };

  const handleAddMember = (member: Member) => {
    const currentMembers = getValues("members");
    if (!currentMembers.find(m => m.user_id === member.user_id)) {
      setValue("members", [...currentMembers, member], { shouldValidate: true });
    }
    setSearchTerm('');
  };

  const handleRemoveMember = (userId: number) => {
    const currentMembers = getValues("members");
    setValue("members", currentMembers.filter(m => m.user_id !== userId), { shouldValidate: true });
  };

  const handleMaterialSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMaterialSearchTerm(val);
    if (val.trim().length > 2) searchMaterialTrigger(val);
  };

  const handleAddMaterial = (material: any) => {
    if (!selectedMaterials.find(m => m.id === material.id)) {
      setSelectedMaterials(prev => [...prev, { ...material, selectedQty: 1, enteredSerials: [] }]);
    }
    setMaterialSearchTerm('');
  };

  const handleUpdateMaterialQty = (materialId: string, delta: number) => {
    setSelectedMaterials(prev => prev.map(mat => {
      if (mat.id === materialId) {
        const newQty = mat.selectedQty + delta;
        if (newQty >= 1 && newQty <= mat.available_stock) {
          let updatedSerials = mat.enteredSerials;
          if (mat.is_serialized && newQty < mat.enteredSerials.length) {
            updatedSerials = mat.enteredSerials.slice(0, newQty);
          }
          return { ...mat, selectedQty: newQty, enteredSerials: updatedSerials };
        } else if (newQty > mat.available_stock) {
          toast.error(`عفواً، أقصى رصيد متاح هو ${mat.available_stock}`);
        }
      }
      return mat;
    }));
  };

  const handleAddSerial = (materialId: string) => {
    const currentSerial = serialInput[materialId]?.trim();
    if (!currentSerial) return;

    setSelectedMaterials(prev => prev.map(mat => {
      if (mat.id === materialId) {
        if (mat.enteredSerials.length >= mat.selectedQty) {
          toast.error(`لا يمكنك إضافة سيريالات أكثر من الكمية المحددة (${mat.selectedQty})`);
          return mat;
        }
        if (mat.enteredSerials.includes(currentSerial)) {
          toast.error(`هذا السيريال مضاف بالفعل!`);
          return mat;
        }
        return { ...mat, enteredSerials: [...mat.enteredSerials, currentSerial] };
      }
      return mat;
    }));
    setSerialInput(prev => ({ ...prev, [materialId]: "" }));
  };

  const handleRemoveSerial = (materialId: string, serialToRemove: string) => {
    setSelectedMaterials(prev => prev.map(mat => {
      if (mat.id === materialId) {
        return { ...mat, enteredSerials: mat.enteredSerials.filter((s: string) => s !== serialToRemove) };
      }
      return mat;
    }));
  };

  //  معالج الصور الذكي للمرحلتين
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, stage: 'BEFORE' | 'AFTER') => {
    if (e.target.files && e.target.files.length > 0) {
      const maxAllowed = 5; // 5 لكل قسم
      const currentPhotosCount = stage === 'BEFORE' ? beforePhotos.length : afterPhotos.length;

      if (currentPhotosCount + e.target.files.length > maxAllowed) {
        toast.error(`عفواً، الحد الأقصى المسموح به هو ${maxAllowed} صور لكل قسم.`);
        return;
      }

      const newPhotosArray: { file: File, preview: string }[] = [];
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true, fileType: "image/jpeg" };

      try {
        for (let i = 0; i < e.target.files.length; i++) {
          const originalFile = e.target.files[i];
          const compressedFile = await imageCompression(originalFile, options);
          const finalFile = new File([compressedFile], originalFile.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          newPhotosArray.push({
            file: finalFile,
            preview: URL.createObjectURL(finalFile), 
          });
        }

        if (stage === 'BEFORE') {
          setBeforePhotos(prev => [...prev, ...newPhotosArray]);
        } else {
          setAfterPhotos(prev => [...prev, ...newPhotosArray]);
        }
        
        toast.success(`تم تجهيز صور مرحلة (${stage === 'BEFORE' ? 'قبل' : 'بعد'}) بنجاح!`);
      } catch (error) {
        toast.error("حدث خطأ أثناء معالجة الصور، يرجى المحاولة مرة أخرى.");
      }
    }
    
    // Reset inputs
    if (stage === 'BEFORE' && beforeFileInputRef.current) beforeFileInputRef.current.value = '';
    if (stage === 'AFTER' && afterFileInputRef.current) afterFileInputRef.current.value = '';
  };

  const onSubmit = async (data: CompleteAssignmentFormValues) => {
    
    // التحقق الصارم من الماليات
    const finalCollectedAmount = paymentMethod === 'CASH' ? collectedAmount : '0';
    const finalPaymentMethod = paymentMethod !== 'NONE' ? paymentMethod : 'NONE';
    const finalAdditionalExpenses = hasExpenses ? additionalExpenses : '0';
    const finalExpensesReason = hasExpenses ? expensesReason : '';

    if (paymentMethod === 'CASH' && (Number(finalCollectedAmount) <= 0 || !collectedAmount)) {
      toast.error("يجب إدخال المبلغ المُحصل نقداً من العميل!");
      return;
    }

    if (hasExpenses) {
      if (Number(finalAdditionalExpenses) <= 0) {
        toast.error("يجب إدخال قيمة المصروفات الإضافية!");
        return;
      }
      if (!finalExpensesReason.trim()) {
        toast.error("يجب كتابة سبب وتفاصيل المصروفات الإضافية!");
        return;
      }
    }

    //  التحقق الصارم من الصور
    if (beforePhotos.length === 0) {
      toast.error("إلزامي: يجب إرفاق صورة واحدة على الأقل قبل العمل.");
      return; 
    }
    if (afterPhotos.length === 0) {
      toast.error("إلزامي: يجب إرفاق صورة واحدة على الأقل بعد العمل.");
      return; 
    }

    for (const mat of selectedMaterials) {
      if (mat.is_serialized && mat.enteredSerials.length !== mat.selectedQty) {
        toast.error(`يجب إدخال السيريالات بالكامل لخامة (${mat.name}).`);
        return; 
      }
    }

    const formData = new FormData();
    formData.append('assignment_id', assignmentId.toString());
    formData.append('tech_notes', techNotes || '');
    formData.append('collected_amount', finalCollectedAmount);
    formData.append('payment_method', finalPaymentMethod);
    formData.append('additional_expenses', finalAdditionalExpenses);
    formData.append('expenses_reason', finalExpensesReason);
    formData.append('started_at', new Date().toISOString());
    formData.append('completed_at', new Date().toISOString());

    const formattedMembers = data.members.map(m => m.user_id);
    formData.append('members', JSON.stringify(formattedMembers));

    const formattedServices = data.services.map(s => ({
      service_id: Number(s.service_id),
      quantity: Number(s.quantity)
    }));
    formData.append('services', JSON.stringify(formattedServices));

    const formattedMaterials = selectedMaterials.map(mat => ({
      material_id: mat.id,
      quantity: mat.selectedQty,
      serials: mat.enteredSerials || [] 
    }));
    formData.append('materials', JSON.stringify(formattedMaterials));

    //  دمج وترتيب الصور قبل وبعد
    const photoStagesArray: string[] = [];
    beforePhotos.forEach((photoObj) => {
      formData.append('images', photoObj.file); 
      photoStagesArray.push('BEFORE');    
    });
    afterPhotos.forEach((photoObj) => {
      formData.append('images', photoObj.file); 
      photoStagesArray.push('AFTER');    
    });
    
    formData.append('photo_stages', JSON.stringify(photoStagesArray));

    try {
      await completeAssignment(formData).unwrap();
      toast.success("تم إنهاء المهمة وإرسالها للمراجعة بنجاح!");
      onClose(); 
    } catch (error: any) {
      toast.error(error?.data?.message || "حدث خطأ أثناء إرسال المهمة.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4" dir="rtl">
      <div className="bg-slate-50 w-full h-[100dvh] rounded-none sm:w-[540px] sm:h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* الهيدر */}
        <div className="flex justify-between bg-secondary p-5 px-6 items-center shrink-0 z-10 shadow-md pt-safe sm:pt-5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-inner">
               <FileText size={20} className="text-white" />
             </div>
             <div>
               <h2 className="text-lg font-normal text-white tracking-wide leading-tight">إقفال المهمة</h2>
               <p className="text-slate-100 text-[11px] font-medium mt-0.5">تسجيل الأعمال والماليات وإرفاق الصور</p>
             </div>
          </div>
          <button onClick={onClose} type="button" className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 bg-transparent">

          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full w-full" dir="rtl">
              <div className="flex flex-col gap-6 p-4 sm:p-6 pb-10">

                {/* الخدمات المنفذة */}
                <div className="bg-white rounded-2xl  shadow-sm border border-slate-200/70 space-y-4">
                  <div className="text-xs  p-5 rounded-t-2xl bg-gray-100 font-bold    uppercase tracking-widest text-primary flex items-center gap-2">
                      <div className='shadow-md p-2 rounded-full'>
                        <Wrench size={16} className="text-primary/70" />

                      </div>
                    
                     الخدمات المنفذة 
                  </div>
                  

                  <div className="flex flex-col px-3 gap-3">
                    {serviceFields.map((field, index) => (
                      <div key={field.id} className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center gap-1">
                          <div className="flex-1">
                            <Controller
                              control={control}
                              name={`services.${index}.service_id` as const}
                              render={({ field: selectField }) => (
                                <Select value={selectField.value ? String(selectField.value) : undefined} onValueChange={(val) => selectField.onChange(val)}>
                                  <SelectTrigger dir='rtl' className={cn("w-35 sm:w-80  h-11 bg-slate-50 text-clip text-sm text-start px-4 hover:bg-slate-100/50 rounded-xl  border-slate-200 shadow-none transition-colors", errors.services?.[index]?.service_id && "border-red-500 ring-2 ring-red-500/20")}>
                                    <SelectValue placeholder="اختر الخدمة..." />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl  border-slate-200 shadow-xl ">
                                    {servicesList.map(srv => (
                                      <SelectItem dir='rtl' key={srv.id} value={String(srv.id)} className="rounded-lg p-2 pr-7 font-normal text-[11px]  cursor-pointer">
                                        {srv.name_ar} {Number(srv.base_price) > 0 && <span className="text-slate-400  text-[11px] mr-1 font-mono">({Number(srv.base_price)} ج)</span>}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>

                          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 h-9 shrink-0 overflow-hidden shadow-none">
                            <button type="button" onClick={() => { const currentQty = Number(getValues(`services.${index}.quantity`)); if (currentQty > 1) setValue(`services.${index}.quantity` as const, currentQty - 0.5); }} className="px-2 h-full text-slate-500 hover:bg-slate-200 transition-colors"><Minus size={14} /></button>
                            <span className="text-sm font-bold w-10 text-center bg-white h-full flex items-center justify-center border-x border-slate-200">{watchedServices[index]?.quantity || 1}</span>
                            <button type="button" onClick={() => { const currentQty = Number(getValues(`services.${index}.quantity`)); setValue(`services.${index}.quantity` as const, currentQty + 0.5); }} className="px-2 h-full text-slate-500 hover:bg-slate-200 transition-colors"><Plus size={14} /></button>
                          </div>

                          {serviceFields.length > 1 && (
                            <button type="button" onClick={() => removeService(index)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                <div className='p-5'>
                  <button type="button" onClick={() => appendService({ service_id: "", quantity: 1 })} disabled={serviceFields.length >= servicesList.length} className="text-xs  font-bold text-secondary hover:bg-secondary/10 hover:text-secondary-foreground p-2 rounded-xl flex items-center gap-1.5 w-fit transition-colors">
                    <Plus size={16} /> إضافة خدمة أخرى
                  </button>
                </div>
                  


                </div>

                {/* الفنيين */}
                <div className="bg-white  rounded-2xl shadow-sm border border-slate-200/70 space-y-4">
                  <div className="text-xs p-5 bg-gray-100 rounded-t-2xl  font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                   <div className='shadow-md p-2 rounded-full'>
                        <Users size={16} className="text-primary/70" />

                      </div>
                     الفنيين المشاركين 
                  </div>


                  <div className="flex flex-wrap px-5 gap-2">
                    {watchedMembers.map(member => (
                      <div key={member.user_id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm animate-in zoom-in-95">
                        <span>{member.name}</span>
                        <button type="button" onClick={() => handleRemoveMember(member.user_id)} className="text-slate-400 hover:text-red-500 p-0.5"><X size={14} strokeWidth={2.5} /></button>
                      </div>
                    ))}
                  </div>

                  <div className="relative p-5">
                    <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl px-3 h-11 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
                      {isSearching ? <Loader2 size={16} className="text-slate-400 ml-2 animate-spin shrink-0" /> : <Search size={16} className="text-slate-400 ml-2 shrink-0" />}
                      <input type="text" placeholder="بحث وإضافة فني..." value={searchTerm} onChange={handleSearch} className="w-full text-sm  bg-transparent outline-none" />
                    </div>
                    {searchTerm.length > 2 && activeSearchResults.length > 0 && (
                      <ul className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-40 overflow-y-auto p-1.5 animate-in slide-in-from-top-2">
                        {activeSearchResults.map(res => (
                          <li key={res.user_id} onClick={() => handleAddMember(res)} className="p-3 text-xs font-bold hover:bg-slate-50 rounded-lg cursor-pointer flex justify-between">
                            <span>{res.name}</span><span className="text-slate-400 font-mono">#{res.user_id}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* الخامات */}
                <div className="bg-white  rounded-2xl shadow-sm border border-slate-200/70 space-y-4">
                  <div className="text-xs p-5 bg-gray-100 rounded-t-2xl  font-bold uppercase tracking-widest text-primary flex items-center gap-2">

                       <div className='shadow-md p-2 rounded-full'>
                        <Package size={16} className="text-primary/70" />

                      </div>             
                        الخامات المستهلكة 
                  </div>

                  <div className="space-y-4 p-5">
                    {selectedMaterials.length > 0 && (
                      <div className="flex flex-col gap-4">
                        {selectedMaterials.map((mat) => (
                          <div key={mat.id} className={cn("p-4 bg-slate-50 border rounded-2xl relative transition-all", mat.is_serialized && mat.enteredSerials.length !== mat.selectedQty ? "border-red-300 ring-1 ring-red-100" : "border-slate-200")}>
                            <button type="button" onClick={() => setSelectedMaterials(prev => prev.filter(m => m.id !== mat.id))} className="absolute top-3 left-3 text-slate-400 hover:text-red-500 hover:bg-white p-1.5 rounded-xl transition-colors shadow-sm bg-slate-100">
                              <Trash2 size={16} />
                            </button>
                            <div className="font-bold text-sm text-slate-800 pr-2 flex flex-col gap-1.5">
                              <span className="flex items-center gap-2">
                                {mat.name}
                                {mat.is_serialized && <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200 px-1.5 py-0">مسريلة</Badge>}
                              </span>
                              {Number(mat.current_price) > 0 && <span className="text-xs text-primary font-mono">{Number(mat.current_price).toLocaleString()} ج / {mat.unit}</span>}
                            </div>

                            <div className="mt-4 flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100">
                              <span className="text-[11px] text-slate-500 font-bold px-2">الكمية:</span>
                              <div className="flex items-center border border-slate-200 rounded-lg h-9 bg-slate-50 overflow-hidden">
                                  <button type="button" onClick={() => handleUpdateMaterialQty(mat.id, -1)} className="px-3 h-full hover:bg-slate-200 transition-colors"><Minus size={14} /></button>
                                  <span className="text-xs font-bold w-10 text-center text-slate-800 bg-white h-full flex items-center justify-center border-x border-slate-200">{mat.selectedQty}</span>
                                  <button type="button" onClick={() => handleUpdateMaterialQty(mat.id, 1)} className="px-3 h-full hover:bg-slate-200 transition-colors"><Plus size={14} /></button>
                              </div>
                            </div>

                            {mat.is_serialized && (
                              <div className="mt-3 bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5"><QrCode size={12}/> السيريالات:</span>
                                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", mat.enteredSerials.length === mat.selectedQty ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
                                    {mat.enteredSerials.length} من {mat.selectedQty}
                                  </span>
                                </div>

                                {mat.enteredSerials.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {mat.enteredSerials.map((serial: string, idx: number) => (
                                      <div key={idx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium">
                                        {serial}
                                        <button type="button" onClick={() => handleRemoveSerial(mat.id, serial)} className="text-slate-400 hover:text-red-500"><X size={12} strokeWidth={3}/></button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {mat.enteredSerials.length < mat.selectedQty && (
                                  <div className="flex gap-2">
                                    <input 
                                      type="text" 
                                      placeholder="اكتب السيريال واضغط إضافة..." 
                                      value={serialInput[mat.id] || ""}
                                      onChange={(e) => setSerialInput(prev => ({...prev, [mat.id]: e.target.value}))}
                                      onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddSerial(mat.id); } }}
                                      className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all bg-slate-50" 
                                    />
                                    <button type="button" onClick={() => handleAddSerial(mat.id)} className="h-10 px-4 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-secondary/90 transition-colors shadow-sm">
                                      إضافة
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="relative">
                      <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl px-3 h-11 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
                        {isSearchingMaterials ? <Loader2 size={16} className="text-slate-400 ml-2 animate-spin shrink-0" /> : <Search size={16} className="text-slate-400 ml-2 shrink-0" />}
                        <input type="text" placeholder="بحث عن خامة لإضافتها..." value={materialSearchTerm} onChange={handleMaterialSearch} className="w-full text-sm font-medium bg-transparent outline-none" />
                      </div>
                      {materialSearchTerm.length > 1 && activeMaterialResults.length > 0 && (
                        <ul className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-40 overflow-y-auto p-1.5 animate-in slide-in-from-top-2">
                          {activeMaterialResults.map((res: any) => (
                            <li key={res.id} onClick={() => handleAddMaterial(res)} className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer flex justify-between items-center transition-colors">
                              <span className="text-xs font-bold flex items-center gap-1">{res.name} {res.is_serialized && <Badge variant="outline" className="text-[8px] bg-amber-50 text-amber-700 px-1 py-0 border-amber-200">مسريلة</Badge>}</span>
                              <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-md font-mono">{res.available_stock} متاح</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
                   

                   {/* // photo  */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 space-y-4">
                   <div className="text-xs p-5 bg-gray-100  rounded-t-xl   font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                         <div className='shadow-md p-2 rounded-full'>
                        <Camera size={16} className="text-primary/70" />

                      </div> الصور والملاحظات 
                  </div>

                  <div className="space-y-5 p-5">
                    <textarea 
                      value={techNotes}
                      onChange={(e) => setTechNotes(e.target.value)}
                      placeholder="اكتب هنا تقرير الفني والملاحظات الخاصة بالمهمة..."
                      className="w-full h-24 p-4 text-sm font-medium border border-slate-200 rounded-2xl bg-slate-50 outline-none resize-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    ></textarea>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* صور قبل */}
                      <div className="border border-slate-200 bg-slate-50 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-700">صور قبل العمل</h4>
                        </div>
                        <input type="file" multiple accept="image/*" ref={beforeFileInputRef} className="hidden" onChange={(e) => handlePhotoUpload(e, 'BEFORE')} />
                        <button type="button" onClick={() => beforeFileInputRef.current?.click()} className="w-full h-10 border border-dashed border-primary/40 bg-primary/5 rounded-xl text-primary text-xs font-bold hover:bg-primary/10 flex justify-center items-center gap-2 transition-all">
                          <ImagePlus size={16} /> التقط صور قبل
                        </button>
                        {beforePhotos.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {beforePhotos.map((photo, idx) => (
                              <div key={idx} className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shadow-sm group bg-white">
                                <img src={photo.preview} alt="before" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                <button type="button" onClick={() => setBeforePhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 left-1 bg-white/90 text-red-500 rounded-full p-1 hover:bg-red-500 hover:text-white transition-colors shadow-sm"><X size={12} strokeWidth={3}/></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* صور بعد */}
                      <div className="border border-slate-200 bg-slate-50 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-700">صور بعد العمل</h4>
                        </div>
                        <input type="file" multiple accept="image/*" ref={afterFileInputRef} className="hidden" onChange={(e) => handlePhotoUpload(e, 'AFTER')} />
                        <button type="button" onClick={() => afterFileInputRef.current?.click()} className="w-full h-10 border border-dashed border-emerald-400 bg-emerald-50 rounded-xl text-emerald-600 text-xs font-bold hover:bg-emerald-100 flex justify-center items-center gap-2 transition-all">
                          <ImagePlus size={16} /> التقط صور بعد
                        </button>
                        {afterPhotos.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {afterPhotos.map((photo, idx) => (
                              <div key={idx} className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shadow-sm group bg-white">
                                <img src={photo.preview} alt="after" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                <button type="button" onClick={() => setAfterPhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 left-1 bg-white/90 text-red-500 rounded-full p-1 hover:bg-red-500 hover:text-white transition-colors shadow-sm"><X size={12} strokeWidth={3}/></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

            
               {/* 🔴 1. قسم التحصيل (الإيرادات) */}
                <div className="bg-slate-50/80 border border-slate-200 p-5 rounded-3xl shadow-md space-y-5">
                   <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                        <Banknote size={16} />
                      </div>
                      تحصيل حساب المهمة
                    </div>
                    
                  </h3>

                  {/* الحساب التلقائي للسعر المتوقع */}
                  {calculatedTotalAmount > 0 && (
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calculator size={18} className="text-emerald-500" />
                        <span className="text-sm font-bold">الحساب : </span>
                      </div>
                      <span className="font-mono text-xl font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
                        {calculatedTotalAmount.toLocaleString()} ج
                      </span>
                    </div>
                  )}

                  <div className="space-y-4 pt-1">
                    <label className="text-[13px] font-bold text-slate-700">كيف سيتم دفع حساب هذه المهمة؟</label>
                    <div className="grid grid-cols-3 mt-4 gap-2.5">
                      <button 
                        type="button" 
                        onClick={() => { setPaymentMethod('NONE'); setCollectedAmount(""); }} 
                        className={cn("h-9 rounded-xl text-xs font-bold border transition-all duration-200", paymentMethod === 'NONE' ? "bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-800/20" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700")}
                      >
                        بدون دفع
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setPaymentMethod('CASH')} 
                        className={cn("h-9 rounded-xl text-xs font-bold border transition-all duration-200", paymentMethod === 'CASH' ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20" : "bg-white text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600")}
                      >
                        نقداً (كاش)
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setPaymentMethod('TRANSFER'); setCollectedAmount(""); }} 
                        className={cn("h-9 rounded-xl text-xs font-bold border transition-all duration-200", paymentMethod === 'TRANSFER' ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20" : "bg-white text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600")}
                      >
                        تحويل بنكي
                      </button>
                    </div>

                    {paymentMethod === 'CASH' && (
                      <div className="relative animate-in slide-in-from-top-2 pt-1">
                        <input 
                          type="number" 
                          min="0" 
                          placeholder="أدخل المبلغ الذي استلمته من العميل فعلياً..." 
                          value={collectedAmount} 
                          onChange={(e) => setCollectedAmount(e.target.value)} 
                          className="w-full h-14 px-4 pl-14 rounded-2xl border-2 border-emerald-200 bg-white text-lg font-mono  outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm" 
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm  text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">ج.م</span>
                      </div>
                    )}

                    {paymentMethod === 'TRANSFER' && (
                      <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[12px] font-bold p-3.5 rounded-xl animate-in slide-in-from-top-2 flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
                        <p className="leading-relaxed">سيتم مراجعة التحويل بمعرفة الإدارة وتأكيد الوصول. لا تقم باستلام أي مبالغ نقدية من العميل في هذه الحالة.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200 p-5 rounded-3xl shadow-sm space-y-5">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-md  flex items-center justify-center text-rose-900">
                        <Sigma size={16} />
                      </div>
                      مصروفات خارجية
                    </div>
                  </h3>

                  <div className="space-y-4 pt-1">
                    <label className="text-[13px] font-bold text-slate-700">هل قمت بشراء خامات من خارج الشركة أو لديك مصروفات؟</label>
                    <div className="grid grid-cols-2 mt-4 gap-2.5">
                      <button 
                        type="button" 
                        onClick={() => { setHasExpenses(false); setAdditionalExpenses(""); setExpensesReason(""); }} 
                        className={cn("h-12 rounded-xl text-xs font-bold border transition-all duration-200", !hasExpenses ? "bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-800/20" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700")}
                      >
                        لا، لا يوجد مصروفات
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setHasExpenses(true)} 
                        className={cn("h-12 rounded-xl text-xs font-bold border transition-all duration-200", hasExpenses ? "bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/20" : "bg-white text-slate-500 border-slate-200 hover:bg-rose-50 hover:text-rose-600")}
                      >
                        نعم، يوجد مصروفات
                      </button>
                    </div>

                    {hasExpenses && (
                      <div className="space-y-3.5 animate-in slide-in-from-top-2 pt-2">
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0" 
                            placeholder="أدخل قيمة المصروفات..." 
                            value={additionalExpenses} 
                            onChange={(e) => setAdditionalExpenses(e.target.value)} 
                            className="w-full h-14 px-4 pl-14 rounded-2xl border-2 border-rose-200 bg-white text-lg font-mono  outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm" 
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md">ج.م</span>
                        </div>
                        <input 
                          type="text" 
                          placeholder="اكتب تفاصيل وسبب المصروفات بدقة (مطلوب)" 
                          value={expensesReason} 
                          onChange={(e) => setExpensesReason(e.target.value)} 
                          className={cn("w-full h-14 px-4 rounded-2xl border-2 bg-white shadow-sm text-[13px] font-bold outline-none transition-all duration-200", !expensesReason.trim() ? "border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10" : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-400/10")} 
                        />
                        {!expensesReason.trim() && (
                          <p className="text-[11px] text-rose-500 font-bold px-2 flex items-center gap-1">
                            <AlertCircle size={12} /> يرجى توضيح سبب المصروفات ليتم اعتمادها من الإدارة
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="p-5 border-t border-slate-200 bg-white shrink-0 z-10 w-full mt-auto shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
            <button 
              type="submit"
              disabled={isSubmitting || !isValid} 
              className={cn(
                "w-full h-14 rounded-2xl font-bold text-sm shadow-xl transition-all flex justify-center items-center gap-2",
                (isSubmitting || !isValid) ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" : "bg-primary hover:bg-primary/90 text-white hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              )}
            >
              {isSubmitting ? (
                <><Loader2 size={20} className="animate-spin" /> جاري إقفال المهمة ورفع البيانات...</>
              ) : (
                'حفظ وإنهاء المهمة الميدانية'
              )}
            </button>
          </div>

        </form>
      </div>   
    </div>
  );
}