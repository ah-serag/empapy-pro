"use client"

import React, { useState } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Edit, Trash2, Loader2, Wrench, Layers, FolderTree, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { categorySchema, serviceSchema, CategoryFormValues, ServiceFormValues, Category, Service } from "@/lib/validation/servicesSchema"

import {
  useGetCategoriesAndServicesQuery,
  useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation,
  useCreateServiceMutation, useUpdateServiceMutation, useDeleteServiceMutation
} from "@/redux/features/servesAndCategorySlice"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// المكون الخاص بتسعير العمولة
import ServiceCommissionModal from "@/components/manager/services/ServiceCommissionModal"

export default function CategoriesAndServicesPage() {
  const [activeTab, setActiveTab] = useState("all")
  
  // التحكم في الأقسام المفتوحة والمقفولة
  const [expandedCats, setExpandedCats] = useState<number[]>([])

  // ================= API HOOKS =================
  const { data: combinedData, isLoading } = useGetCategoriesAndServicesQuery({})
  
  const categoriesList: Category[] = combinedData?.data || []
  const flatServicesList: any[] = categoriesList.flatMap((cat) => cat.services || [])

  // Mutations
  const [createCat, { isLoading: isCreatingCat }] = useCreateCategoryMutation()
  const [updateCat, { isLoading: isUpdatingCat }] = useUpdateCategoryMutation()
  const [deleteCat] = useDeleteCategoryMutation()

  const [createSrv, { isLoading: isCreatingSrv }] = useCreateServiceMutation()
  const [updateSrv, { isLoading: isUpdatingSrv }] = useUpdateServiceMutation()
  const [deleteSrv] = useDeleteServiceMutation()

  // ================= STATES =================
  const [isCatModalOpen, setIsCatModalOpen] = useState(false)
  const [selectedCat, setSelectedCat] = useState<Category | null>(null)
  
  const [isSrvModalOpen, setIsSrvModalOpen] = useState(false)
  const [selectedSrv, setSelectedSrv] = useState<Service | null>(null)

  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false)
  const [selectedServiceForCommission, setSelectedServiceForCommission] = useState<any>(null)

  const [deleteItem, setDeleteItem] = useState<{ type: 'cat' | 'srv', id: number, name: string } | null>(null)

  // ================= FORMS =================
  const catForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name_ar: "", name_en: "", icon: "", sort_order: 0, is_active: true }
  })

  const srvForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { category_id: 0, name_ar: "", name_en: "", base_price: 0, duration_hours: 1, is_active: true }
  })

  // ================= HANDLERS =================
  const toggleCat = (id: number) => {
    setExpandedCats((prev) => prev.includes(id) ? prev.filter(catId => catId !== id) : [...prev, id])
  }

  const openCatAdd = () => { 
    setSelectedCat(null); catForm.reset({ name_ar: "", name_en: "", icon: "", sort_order: 0, is_active: true }); setIsCatModalOpen(true); 
  }
  
  const openCatEdit = (cat: Category) => { 
    setSelectedCat(cat); catForm.reset({ name_ar: cat.name_ar, name_en: cat.name_en, icon: cat.icon || "", sort_order: cat.sort_order || 0, is_active: cat.is_active }); setIsCatModalOpen(true); 
  }
  
  const onCatSubmit: SubmitHandler<CategoryFormValues> = async (values) => {
    try {
      if (selectedCat) await updateCat({ id: selectedCat.id, ...values }).unwrap()
      else await createCat(values).unwrap()
      toast.success(selectedCat ? "Category updated!" : "Category created!")
      setIsCatModalOpen(false)
    } catch (err: any) { toast.error(err?.data?.message || "Error saving category") }
  }

  const openSrvAdd = (prefillCategoryId: number = 0) => { 
    setSelectedSrv(null); srvForm.reset({ category_id: prefillCategoryId, name_ar: "", name_en: "", base_price: 0, duration_hours: 1, is_active: true }); setIsSrvModalOpen(true); 
  }
  
  const openSrvEdit = (srv: Service) => { 
    setSelectedSrv(srv); srvForm.reset({ category_id: Number(srv.category_id), name_ar: srv.name_ar, name_en: srv.name_en, base_price: srv.base_price, duration_hours: srv.duration_hours, is_active: srv.is_active }); setIsSrvModalOpen(true); 
  }

  const onSrvSubmit: SubmitHandler<ServiceFormValues> = async (values) => {
    try {
      if (selectedSrv) await updateSrv({ id: selectedSrv.id, ...values }).unwrap()
      else await createSrv(values).unwrap()
      toast.success(selectedSrv ? "Service updated!" : "Service created!")
      setIsSrvModalOpen(false)
    } catch (err: any) { toast.error(err?.data?.message || "Error saving service") }
  }

  const openCommissionModal = (srv: any) => {
    setSelectedServiceForCommission(srv);
    setIsCommissionModalOpen(true);
  };

  // زر العمولة - مرن للموبايل والديسكتوب
  const renderCommissionBadge = (srv: any, isMobileCard = false) => {
    const baseClasses = isMobileCard ? "w-full justify-center h-9 mt-2" : "whitespace-nowrap";
    
    if (srv.has_commission_rule) {
      return (
        <Badge 
          variant="outline" 
          className={`cursor-pointer hover:bg-emerald-50 border-emerald-200 text-emerald-700 font-bold ${baseClasses}`} 
          onClick={() => openCommissionModal(srv)}
        >
          <CheckCircle2 className="w-3 h-3 mr-1.5" />
          {srv.commission_type === 'PERCENTAGE' ? `${srv.pool_value}%` : `${srv.pool_value} ج.م`}
        </Badge>
      );
    }
    return (
      <Badge 
        variant="outline" 
        className={`cursor-pointer hover:bg-amber-50 border-amber-200 text-amber-700 font-bold ${baseClasses}`} 
        onClick={() => openCommissionModal(srv)}
      >
        <AlertCircle className="w-3 h-3 mr-1.5" />
        Set Commission
      </Badge>
    );
  };

  const confirmDelete = async () => {
    if (!deleteItem) return
    try {
      if (deleteItem.type === 'cat') await deleteCat(deleteItem.id).unwrap()
      if (deleteItem.type === 'srv') await deleteSrv(deleteItem.id).unwrap()
      toast.success("Deleted successfully!")
      setDeleteItem(null)
    } catch (err: any) { toast.error(err?.data?.message || "Cannot delete item. It might be linked.") }
  }

  return (
    <div className="space-y-6 p-4 md:p-8 w-full max-w-dvw overflow-hidden bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex text-primary items-center gap-2">
            <FolderTree className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Categories & Services
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage main categories and their detailed services seamlessly.</p>
        </div>
      </div>

  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-20 mt-20">
        
        {/* ======================= TABS HEADER (Mobile: Col, Desktop: Row) ======================= */}
        <div className="w-full mb-6">
          <TabsList className="flex flex-col sm:flex-row w-full h-auto p-1.5 bg-slate-100/80 border border-slate-200/60 rounded-2xl gap-1.5">
            <TabsTrigger 
              value="all" 
              className="w-full sm:flex-1 py-3 sm:py-2.5 h-auto sm:h-10 flex justify-center items-center rounded-xl text-[13px] font-bold shadow-none data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <FolderTree className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> All
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="w-full sm:flex-1 py-3 sm:py-2.5 h-auto sm:h-10 flex justify-center items-center rounded-xl text-[13px] font-bold shadow-none data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <Layers className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> Categories
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="w-full sm:flex-1 py-3 sm:py-2.5 h-auto sm:h-10 flex justify-center items-center rounded-xl text-[13px] font-bold shadow-none data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <Wrench className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> Services
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ======================= TAB 1: ALL ======================= */}
        <TabsContent value="all" className="space-y-4 animate-in mt-16 fade-in duration-300 w-full">
          {isLoading && (
            <div className="text-center py-12 text-slate-400 font-bold animate-pulse bg-white border border-slate-200/60 rounded-2xl shadow-sm">
              Loading data...
            </div>
          )}
          {!isLoading && categoriesList.length === 0 && (
            <div className="text-center py-12 text-slate-500 font-bold bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
              No data found.
            </div>
          )}
          
          {categoriesList.map((cat) => {
            const isExpanded = expandedCats.includes(cat.id);
            return (
              <div key={cat.id} className="bg-white border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md">
                
                {/* Category Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 sm:p-5">
                  <div 
                    className="flex-1 flex items-center gap-3 cursor-pointer group w-full"
                    onClick={() => toggleCat(cat.id)}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0 border border-slate-100">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] sm:text-base font-bold flex flex-wrap items-center gap-2 text-slate-800 leading-tight truncate">
                        {cat.name_en} 
                        <Badge variant={cat.is_active ? "default" : "secondary"} className={`text-[10px] font-bold px-2 py-0.5 rounded-md h-5 whitespace-nowrap ${cat.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none' : ''}`}>
                          {cat.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </h3>
                      <p className="text-slate-500 text-[12px] sm:text-[13px] mt-0.5 font-medium truncate">{cat.name_ar}</p>
                    </div>
                  </div>

                  {/* Category Actions */}
                  <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 pl-12 rtl:pl-0 rtl:pr-12 md:pl-0 md:rtl:pr-0">
                    <Button variant="outline" size="sm" onClick={() => openCatEdit(cat)} className="flex-1 md:flex-none h-10 rounded-xl border-slate-200 text-slate-600 hover:text-primary">
                      <Edit className="w-4 h-4 md:mr-1.5 md:rtl:ml-1.5 md:rtl:mr-0" /> <span className="hidden md:inline font-bold">Edit Cat.</span>
                    </Button>
                    <Button size="sm" onClick={() => openSrvAdd(cat.id)} className="flex-1 md:flex-none h-10 rounded-xl bg-primary text-white hover:bg-primary/90 font-bold">
                      <Plus className="w-4 h-4 md:mr-1.5 md:rtl:ml-1.5 md:rtl:mr-0" /> <span className="hidden md:inline">Add Service</span>
                    </Button>
                  </div>
                </div>

                {/* Expanded Services Content */}
                {isExpanded && (
                  <div className="bg-slate-50/50 border-t border-slate-100 p-4 sm:p-5 animate-in slide-in-from-top-2 w-full">
                    {cat.services && cat.services.length > 0 ? (
                      <>
                        {/* 📱 MOBILE VIEW: SERVICE CARDS */}
                        <div className="grid grid-cols-1 gap-3 md:hidden">
                          {cat.services.map((srv: any) => (
                            <div key={srv.id} className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-[14px] text-slate-800 leading-tight">{srv.name_en}</h4>
                                  <p className="text-[12px] text-slate-500 mt-0.5">{srv.name_ar}</p>
                                </div>
                                <Badge variant={srv.is_active ? "outline" : "secondary"} className="text-[10px] font-bold">
                                  {srv.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                                <span className="font-mono font-bold text-primary text-[14px]">{srv.base_price} ج.م</span>
                                <span className="text-[12px] text-slate-500 font-medium">{srv.duration_hours} hrs</span>
                              </div>
                              
                              <div className="mt-1">
                                {renderCommissionBadge(srv, true)}
                              </div>

                              <div className="flex gap-2 pt-3 mt-1 border-t border-slate-50">
                                <Button variant="outline" size="sm" className="flex-1 h-9 rounded-lg text-[12px] font-bold" onClick={() => openSrvEdit(srv)}>
                                  <Edit className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Edit
                                </Button>
                                <Button variant="destructive" size="sm" className="flex-1 h-9 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border-none shadow-none font-bold text-[12px]" onClick={() => setDeleteItem({ type: 'srv', id: srv.id, name: srv.name_en })}>
                                  <Trash2 className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 💻 DESKTOP VIEW: SERVICE TABLE */}
                        <div className="hidden md:block bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm w-full">
                          <Table>
                            <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="font-bold text-slate-600 py-3 whitespace-nowrap">Service (EN / AR)</TableHead>
                                <TableHead className="font-bold text-slate-600 py-3 whitespace-nowrap">Price (ج.م)</TableHead>
                                <TableHead className="font-bold text-slate-600 py-3 whitespace-nowrap">Commission</TableHead>
                                <TableHead className="font-bold text-slate-600 py-3 whitespace-nowrap">Duration</TableHead>
                                <TableHead className="font-bold text-slate-600 py-3 whitespace-nowrap">Status</TableHead>
                                <TableHead className="text-right font-bold text-slate-600 py-3 whitespace-nowrap">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cat.services.map((srv: any) => (
                                <TableRow key={srv.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                  <TableCell className="font-medium py-3 whitespace-nowrap">
                                    <span className="text-slate-800 font-bold block">{srv.name_en}</span>
                                    <span className="text-xs text-slate-500 block mt-0.5">{srv.name_ar}</span>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap font-mono font-bold text-primary py-3">{srv.base_price}</TableCell>
                                  <TableCell className="whitespace-nowrap py-3">{renderCommissionBadge(srv)}</TableCell>
                                  <TableCell className="whitespace-nowrap text-slate-600 font-medium py-3">{srv.duration_hours} hrs</TableCell>
                                  <TableCell className="whitespace-nowrap py-3"><Badge variant={srv.is_active ? "outline" : "secondary"} className="text-[10px] font-bold">{srv.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                                  <TableCell className="text-right py-3 space-x-2 rtl:space-x-reverse whitespace-nowrap">
                                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-slate-600 hover:text-primary hover:bg-primary/5 font-bold" onClick={() => openSrvEdit(srv)}><Edit className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Edit</Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setDeleteItem({ type: 'srv', id: srv.id, name: srv.name_en })}><Trash2 className="w-4 h-4" /></Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6 text-[13px] font-medium text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
                        No services linked to this category yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </TabsContent>

        {/* ======================= TAB 2: CATEGORIES ONLY ======================= */}
        <TabsContent value="categories" className="space-y-4 mt-16 animate-in fade-in duration-300 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 border border-slate-200/60 shadow-sm gap-4 md:gap-0 rounded-2xl">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Layers className="text-primary w-5 h-5" /> Categories List
            </h2>
            <Button onClick={openCatAdd} className="w-full rounded-xl md:w-auto h-11 bg-primary hover:bg-primary/90 font-bold shadow-sm">
              <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Add Category
            </Button>
          </div>
          
          {/* 📱 MOBILE VIEW: CATEGORY CARDS */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {isLoading && <div className="text-center py-12 text-slate-400 font-bold animate-pulse bg-white border border-slate-200/60 rounded-2xl shadow-sm">Loading...</div>}
            {!isLoading && categoriesList.length === 0 && <div className="text-center py-12 text-slate-500 font-bold bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">No categories found.</div>}
            {categoriesList.map((cat) => (
              <div key={cat.id} className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-4 flex flex-col gap-4">
                <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                  <div>
                    <h4 className="font-bold text-[15px] text-slate-800 leading-tight">{cat.name_en}</h4>
                    <p className="text-[12px] text-slate-500 mt-1">{cat.name_ar}</p>
                    <span className="text-[11px] text-slate-400 mt-1.5 block font-medium bg-slate-50 px-2 py-0.5 rounded w-fit">Sort: {cat.sort_order}</span>
                  </div>
                  <Badge variant={cat.is_active ? "default" : "secondary"} className={`text-[10px] font-bold ${cat.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none' : ''}`}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="h-9 rounded-lg px-4 text-[12px] font-bold" onClick={() => openCatEdit(cat)}>
                    <Edit className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Edit
                  </Button>
                  <Button variant="destructive" size="icon" className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border-none shadow-none" onClick={() => setDeleteItem({ type: 'cat', id: cat.id, name: cat.name_en })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* 💻 DESKTOP VIEW: CATEGORY TABLE */}
          <div className="hidden md:block bg-white border border-slate-200/60 shadow-sm overflow-hidden rounded-2xl w-full">
            <Table>
              <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap font-bold text-slate-600 py-4">Category (EN)</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-slate-600 py-4">Category (AR)</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-slate-600 py-4">Sort</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-slate-600 py-4">Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap font-bold text-slate-600 py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400 font-bold animate-pulse">Loading...</TableCell></TableRow>}
                {!isLoading && categoriesList.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500 font-bold">No categories found.</TableCell></TableRow>}
                {categoriesList.map((cat) => (
                  <TableRow key={cat.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                    <TableCell className="font-bold text-slate-800 whitespace-nowrap py-3">{cat.name_en}</TableCell>
                    <TableCell className="whitespace-nowrap text-slate-600 font-medium py-3">{cat.name_ar}</TableCell>
                    <TableCell className="whitespace-nowrap py-3">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 font-mono text-[13px]">{cat.sort_order}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-3">
                      <Badge variant={cat.is_active ? "default" : "secondary"} className={`text-[11px] font-bold ${cat.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none' : ''}`}>
                        {cat.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2 rtl:space-x-reverse whitespace-nowrap py-3">
                      <Button variant="outline" size="sm" className="h-9 rounded-xl font-bold text-slate-600" onClick={() => openCatEdit(cat)}>
                        <Edit className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Edit
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setDeleteItem({ type: 'cat', id: cat.id, name: cat.name_en })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ======================= TAB 3: SERVICES ONLY ======================= */}
        <TabsContent value="services" className="space-y-4 mt-16 animate-in fade-in duration-300 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 border border-slate-200/60 shadow-sm gap-4 md:gap-0 rounded-2xl">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Wrench className="text-primary w-5 h-5" /> Services List
            </h2>
            <Button onClick={() => openSrvAdd()} className="w-full rounded-xl md:w-auto h-11 bg-primary hover:bg-primary/90 font-bold shadow-sm">
              <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Add Service
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {isLoading && <div className="text-center py-12 text-slate-400 font-bold animate-pulse bg-white border border-slate-200/60 rounded-2xl shadow-sm">Loading...</div>}
            {!isLoading && flatServicesList.length === 0 && <div className="text-center py-12 text-slate-500 font-bold bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">No services found.</div>}
            {flatServicesList.map((srv: any) => {
              const parentCat = categoriesList.find((c) => c.id === srv.category_id)
              return (
                <div key={srv.id} className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                    <div>
                      <h4 className="font-bold text-[15px] text-slate-800 leading-tight">{srv.name_en}</h4>
                      <p className="text-[12px] text-slate-500 mt-1">{srv.name_ar}</p>
                    </div>
                    <Badge variant={srv.is_active ? "outline" : "secondary"} className="text-[10px] font-bold">
                      {srv.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Category</span>
                    <span className="text-[13px] font-bold text-slate-700">{parentCat?.name_en || "N/A"}</span>
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <span className="font-mono font-bold text-primary text-[15px]">{srv.base_price} ج.م</span>
                    <span className="text-[12px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">{srv.duration_hours} hrs</span>
                  </div>

                  {/* Commission Button Mobile */}
                  <div className="mt-1">
                    {renderCommissionBadge(srv, true)}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                    <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg text-[12px] font-bold" onClick={() => openSrvEdit(srv)}>
                      <Edit className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Edit
                    </Button>
                    <Button variant="destructive" size="icon" className="h-9 w-9 shrink-0 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border-none shadow-none" onClick={() => setDeleteItem({ type: 'srv', id: srv.id, name: srv.name_en })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* DESKTOP VIEW: SERVICE TABLE */}
          <div className="hidden md:block bg-white border border-slate-200/60 shadow-sm overflow-hidden rounded-2xl w-full">
            <Table>
              <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap font-bold text-slate-600 py-4">Service (EN / AR)</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-slate-600 py-4">Category</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-slate-600 py-4">Price (ج.م)</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-slate-600 py-4">Commission</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-slate-600 py-4">Duration</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-slate-600 py-4">Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap font-bold text-slate-600 py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400 font-bold animate-pulse">Loading...</TableCell></TableRow>}
                {!isLoading && flatServicesList.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-500 font-bold">No services found.</TableCell></TableRow>}
                {flatServicesList.map((srv: any) => {
                  const parentCat = categoriesList.find((c) => c.id === srv.category_id)
                  return (
                    <TableRow key={srv.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                      <TableCell className="font-medium whitespace-nowrap py-3">
                        <span className="text-slate-800 font-bold block">{srv.name_en}</span> 
                        <span className="text-xs text-slate-500 block mt-0.5">{srv.name_ar}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-3">
                        <span className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-[13px] font-bold text-slate-700 inline-block">
                          {parentCat?.name_en || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono font-bold text-primary py-3">{srv.base_price}</TableCell>
                      <TableCell className="whitespace-nowrap py-3">{renderCommissionBadge(srv)}</TableCell>
                      <TableCell className="whitespace-nowrap text-slate-600 font-medium py-3">{srv.duration_hours} hrs</TableCell>
                      <TableCell className="whitespace-nowrap py-3"><Badge variant={srv.is_active ? "outline" : "secondary"} className="text-[11px] font-bold">{srv.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell className="text-right space-x-2 rtl:space-x-reverse whitespace-nowrap py-3">
                        <Button variant="outline" size="sm" className="h-9 rounded-xl font-bold text-slate-600" onClick={() => openSrvEdit(srv)}>
                          <Edit className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Edit
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setDeleteItem({ type: 'srv', id: srv.id, name: srv.name_en })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
      {/* المودال الخاص بالإضافة والتعديل للعمولة */}
      <ServiceCommissionModal open={isCommissionModalOpen} onOpenChange={setIsCommissionModalOpen} service={selectedServiceForCommission} />

      {/* ======================= CATEGORY MODAL ======================= */}
      <Dialog open={isCatModalOpen} onOpenChange={setIsCatModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[425px]  rounded-2xl">
          <DialogHeader><DialogTitle>{selectedCat ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <form onSubmit={catForm.handleSubmit(onCatSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name (EN)</label>
                <Input {...catForm.register("name_en")} className="h-10 rounded-lg" />
                {catForm.formState.errors.name_en && <span className="text-xs text-destructive">{catForm.formState.errors.name_en.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Name (AR)</label>
                <Input dir="rtl" {...catForm.register("name_ar")} className="h-10 rounded-lg" />
                {catForm.formState.errors.name_ar && <span className="text-xs text-destructive">{catForm.formState.errors.name_ar.message}</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Sort Order</label>
                <Input type="number" {...catForm.register("sort_order")} className="h-10 rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium">Icon (Optional)</label>
                <Input value={catForm.watch("icon") || ""} onChange={(e) => catForm.setValue("icon", e.target.value)} className="h-10 rounded-lg" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="cat_active" className="w-4 h-4 cursor-pointer" {...catForm.register("is_active")} />
              <label htmlFor="cat_active" className="text-sm cursor-pointer select-none">Active Category</label>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCatModalOpen(false)} className="w-full sm:w-auto h-10 rounded-lg">Cancel</Button>
              <Button type="submit" disabled={isCreatingCat || isUpdatingCat} className="w-full sm:w-auto h-10 rounded-lg">
                {(isCreatingCat || isUpdatingCat) && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} 
                {selectedCat ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================= SERVICE MODAL ======================= */}
      <Dialog open={isSrvModalOpen} onOpenChange={setIsSrvModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px]  rounded-2xl">
          <DialogHeader><DialogTitle>{selectedSrv ? "Edit Service" : "Add Service"}</DialogTitle></DialogHeader>
          <form onSubmit={srvForm.handleSubmit(onSrvSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select {...srvForm.register("category_id", { valueAsNumber: true })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value={0} disabled>Select a category...</option>
                {categoriesList.map((c) => <option key={c.id} value={c.id}>{c.name_en} ({c.name_ar})</option>)}
              </select>
              {srvForm.formState.errors.category_id && <span className="text-xs text-destructive">{srvForm.formState.errors.category_id.message}</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name (EN)</label>
                <Input {...srvForm.register("name_en")} className="h-10 rounded-lg" />
                {srvForm.formState.errors.name_en && <span className="text-xs text-destructive">{srvForm.formState.errors.name_en.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Name (AR)</label>
                <Input dir="rtl" {...srvForm.register("name_ar")} className="h-10 rounded-lg" />
                {srvForm.formState.errors.name_ar && <span className="text-xs text-destructive">{srvForm.formState.errors.name_ar.message}</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Base Price (ج.م)</label>
                <Input type="number" step="0.01" {...srvForm.register("base_price")} className="h-10 rounded-lg font-mono" />
              </div>
              <div>
                <label className="text-sm font-medium">Duration (Hours)</label>
                <Input type="number" step="0.1" {...srvForm.register("duration_hours")} className="h-10 rounded-lg" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="srv_active" className="w-4 h-4 cursor-pointer" {...srvForm.register("is_active")} />
              <label htmlFor="srv_active" className="text-sm cursor-pointer select-none">Active Service</label>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsSrvModalOpen(false)} className="w-full sm:w-auto h-10 rounded-lg">Cancel</Button>
              <Button type="submit" disabled={isCreatingSrv || isUpdatingSrv} className="w-full sm:w-auto h-10 rounded-lg">
                {(isCreatingSrv || isUpdatingSrv) && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} 
                {selectedSrv ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================= DELETE CONFIRMATION ======================= */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent className="w-[90vw] sm:max-w-[425px]  rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-bold text-foreground">{deleteItem?.name}</span> and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="mt-0 border rounded-lg h-10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg h-10 w-full sm:w-auto">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}