"use client"

import React, { useState } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Edit, Trash2, Loader2, MapPin, Map, Globe2, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"

import { governorateSchema, zoneSchema, GovernorateFormValues, ZoneFormValues, Governorate, Zone } from "@/lib/validation/locationsSchema"

import {
  useGetGovernoratesAndZonesQuery,
  useCreateGovernorateMutation, useUpdateGovernorateMutation, useDeleteGovernorateMutation,
  useCreateZoneMutation, useUpdateZoneMutation, useDeleteZoneMutation
} from "@/redux/features/locationsApiSlice"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function LocationsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [expandedGovs, setExpandedGovs] = useState<number[]>([])

  // ================= API HOOKS =================
  const { data: combinedData, isLoading } = useGetGovernoratesAndZonesQuery({})
  
  const governoratesList: Governorate[] = combinedData?.data || []
  const flatZonesList: Zone[] = governoratesList.flatMap((gov) => gov.zones || [])

  // Mutations
  const [createGov, { isLoading: isCreatingGov }] = useCreateGovernorateMutation()
  const [updateGov, { isLoading: isUpdatingGov }] = useUpdateGovernorateMutation()
  const [deleteGov] = useDeleteGovernorateMutation()

  const [createZone, { isLoading: isCreatingZone }] = useCreateZoneMutation()
  const [updateZone, { isLoading: isUpdatingZone }] = useUpdateZoneMutation()
  const [deleteZone] = useDeleteZoneMutation()

  // ================= STATES =================
  const [isGovModalOpen, setIsGovModalOpen] = useState(false)
  const [selectedGov, setSelectedGov] = useState<Governorate | null>(null)
  
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)

  const [deleteItem, setDeleteItem] = useState<{ type: 'gov' | 'zone', id: number, name: string } | null>(null)

  // ================= FORMS =================
const govForm = useForm<GovernorateFormValues>({
  resolver: zodResolver(governorateSchema) as any,
  defaultValues: {
    name_ar: "",
    name_en: "",
    is_active: true,
  },
})
const zoneForm = useForm<ZoneFormValues>({
  resolver: zodResolver(zoneSchema) as any,
  defaultValues: {
    governorate_id: 0,
    name_ar: "",
    name_en: "",
    notes: "",
    is_active: true,
  },
})
  // ================= HANDLERS: EXPAND/COLLAPSE =================
  const toggleGov = (id: number) => {
    setExpandedGovs((prev) => 
      prev.includes(id) ? prev.filter(govId => govId !== id) : [...prev, id]
    )
  }

  // ================= HANDLERS: GOVERNORATES =================
  const openGovAdd = () => { 
    setSelectedGov(null); 
    govForm.reset({ name_ar: "", name_en: "", is_active: true }); 
    setIsGovModalOpen(true); 
  }
  
  const openGovEdit = (gov: Governorate) => { 
    setSelectedGov(gov); 
    govForm.reset({ name_ar: gov.name_ar, name_en: gov.name_en, is_active: gov.is_active }); 
    setIsGovModalOpen(true); 
  }
  
  // الحل النهائي لمشكلة الـ TypeScript
  const onGovSubmit: SubmitHandler<GovernorateFormValues> = async (values) => {
    try {
      if (selectedGov) {
        await updateGov({ id: selectedGov.id, ...values }).unwrap()
      } else {
        await createGov(values).unwrap()
      }
      toast.success(selectedGov ? "Governorate updated!" : "Governorate created!")
      setIsGovModalOpen(false)
    } catch (err: any) { 
      toast.error(err?.data?.message || "Error saving governorate") 
    }
  }

  // ================= HANDLERS: ZONES =================
  const openZoneAdd = (prefillGovId: number = 0) => { 
    setSelectedZone(null); 
    zoneForm.reset({ governorate_id: prefillGovId, name_ar: "", name_en: "", notes: "", is_active: true }); 
    setIsZoneModalOpen(true); 
  }
  
  const openZoneEdit = (zone: Zone) => { 
    setSelectedZone(zone); 
    zoneForm.reset({ 
      governorate_id: Number(zone.governorate_id), 
      name_ar: zone.name_ar, 
      name_en: zone.name_en, 
      notes: zone.notes || "", 
      is_active: zone.is_active 
    }); 
    setIsZoneModalOpen(true); 
  }

  // الحل النهائي لمشكلة الـ TypeScript
  const onZoneSubmit: SubmitHandler<ZoneFormValues> = async (values) => {
    try {
      if (selectedZone) {
        await updateZone({ id: selectedZone.id, ...values }).unwrap()
      } else {
        await createZone(values).unwrap()
      }
      toast.success(selectedZone ? "Zone updated!" : "Zone created!")
      setIsZoneModalOpen(false)
    } catch (err: any) { 
      toast.error(err?.data?.message || "Error saving zone") 
    }
  }

  // ================= HANDLERS: DELETE =================
  const confirmDelete = async () => {
    if (!deleteItem) return
    try {
      if (deleteItem.type === 'gov') await deleteGov(deleteItem.id).unwrap()
      if (deleteItem.type === 'zone') await deleteZone(deleteItem.id).unwrap()
      toast.success("Deleted successfully!")
      setDeleteItem(null)
    } catch (err: any) { 
      toast.error(err?.data?.message || "Cannot delete item. It might be linked.") 
    }
  }

  return (
    <div className="space-y-6 w-full  p-4 md:p-6 max-w-dvw overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row mb-20 sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl text-primary font-bold tracking-tight flex items-center gap-2">
            <Globe2 className="w-6 h-6 sm:w-8 sm:h-8 " />
            Locations Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage governorates and service zones in one place.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-20">
        
        {/* ======================= TABS HEADER ======================= */}
        <div className="w-full mb-6">
          <TabsList className="flex flex-col sm:flex-row w-full h-auto p-1.5 bg-slate-100/80 border border-slate-200/60 rounded-2xl gap-1.5">
            <TabsTrigger 
              value="all" 
              className="w-full sm:flex-1 py-3 sm:py-2.5 h-auto sm:h-10 flex justify-center items-center rounded-xl text-[13px] font-bold shadow-none data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <Globe2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> All
            </TabsTrigger>
            <TabsTrigger 
              value="governorates" 
              className="w-full sm:flex-1 py-3 sm:py-2.5 h-auto sm:h-10 flex justify-center items-center rounded-xl text-[13px] font-bold shadow-none data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <Map className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> Governorates
            </TabsTrigger>
            <TabsTrigger 
              value="zones" 
              className="w-full sm:flex-1 py-3 sm:py-2.5 h-auto sm:h-10 flex justify-center items-center rounded-xl text-[13px] font-bold shadow-none data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              <MapPin className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> Zones
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ======================= TAB 1: ALL TOGETHER ======================= */}
        <TabsContent value="all" className="space-y-4 animate-in mt-16 fade-in duration-300">
          {isLoading && (
            <div className="text-center py-12 text-slate-400 font-bold animate-pulse bg-white border border-slate-200/60 rounded-2xl shadow-sm">
              Loading locations...
            </div>
          )}
          {!isLoading && governoratesList.length === 0 && (
            <div className="text-center py-12 text-slate-500 font-bold bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
              No data found.
            </div>
          )}
          
          {governoratesList.map((gov) => {
            const isExpanded = expandedGovs.includes(gov.id);
            return (
              <div key={gov.id} className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                
                {/* Governorate Header (Accordion Toggle) */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-5">
                  <div 
                    className="flex-1 flex items-center gap-3 cursor-pointer group w-full"
                    onClick={() => toggleGov(gov.id)}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0 border border-slate-100">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] sm:text-base font-bold flex flex-wrap items-center gap-2 text-slate-800 leading-tight">
                        {gov.name_en} 
                        <Badge variant={gov.is_active ? "default" : "secondary"} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${gov.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none' : ''}`}>
                          {gov.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </h3>
                      <p className="text-slate-500 text-[12px] sm:text-[13px] mt-0.5 font-medium">{gov.name_ar}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto pl-12 rtl:pl-0 rtl:pr-12 sm:pl-0 sm:rtl:pr-0">
                    <Button variant="outline" size="sm" onClick={() => openGovEdit(gov)} className="flex-1 sm:flex-none h-10 rounded-xl border-slate-200 text-slate-600 hover:text-primary">
                      <Edit className="w-4 h-4 sm:mr-1.5 sm:rtl:ml-1.5 sm:rtl:mr-0" /> <span className="hidden sm:inline font-bold">Edit</span>
                    </Button>
                    <Button size="sm" onClick={() => openZoneAdd(gov.id)} className="flex-1 sm:flex-none h-10 rounded-xl bg-primary text-white hover:bg-primary/90 font-bold">
                      <Plus className="w-4 h-4 sm:mr-1.5 sm:rtl:ml-1.5 sm:rtl:mr-0" /> <span className="hidden sm:inline">Add Zone</span>
                    </Button>
                  </div>
                </div>

                {/* Expanded Zones Content */}
                {isExpanded && (
                  <div className="bg-slate-50/50 border-t border-slate-100 p-4 sm:p-5 animate-in slide-in-from-top-2">
                    {gov.zones && gov.zones.length > 0 ? (
                      <>
                        {/* Mobile Zones Cards */}
                        <div className="grid grid-cols-1 gap-3 md:hidden">
                          {gov.zones.map((zone) => (
                            <div key={zone.id} className="bg-white border border-slate-200/60 rounded-xl p-3.5 shadow-sm flex flex-col gap-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-[14px] text-slate-800 leading-tight">{zone.name_en}</h4>
                                  <p className="text-[12px] text-slate-500 mt-0.5">{zone.name_ar}</p>
                                </div>
                                <Badge variant={zone.is_active ? "outline" : "secondary"} className="text-[10px] font-bold">
                                  {zone.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                                <Button variant="outline" size="sm" className="h-8 rounded-lg px-3 text-[12px]" onClick={() => openZoneEdit(zone)}>
                                  <Edit className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Edit
                                </Button>
                                <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border-none shadow-none" onClick={() => setDeleteItem({ type: 'zone', id: zone.id, name: zone.name_en })}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop Zones Table */}
                        <div className="hidden md:block bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
                          <Table>
                            <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="font-bold text-slate-600 py-3">Zone (EN / AR)</TableHead>
                                <TableHead className="font-bold text-slate-600 py-3">Status</TableHead>
                                <TableHead className="text-right font-bold text-slate-600 py-3">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {gov.zones.map((zone) => (
                                <TableRow key={zone.id} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors">
                                  <TableCell className="font-medium py-3">
                                    <span className="text-slate-800 font-bold block">{zone.name_en}</span>
                                    <span className="text-xs text-slate-500 block mt-0.5">{zone.name_ar}</span>
                                  </TableCell>
                                  <TableCell className="py-3">
                                    <Badge variant={zone.is_active ? "outline" : "secondary"} className="text-[10px] font-bold">
                                      {zone.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right py-3 space-x-2 rtl:space-x-reverse">
                                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-slate-600 hover:text-primary hover:bg-primary/5 font-bold" onClick={() => openZoneEdit(zone)}>
                                      <Edit className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Edit
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setDeleteItem({ type: 'zone', id: zone.id, name: zone.name_en })}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6 text-[13px] font-medium text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
                        No zones linked to this governorate yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </TabsContent>

        {/* ======================= TAB 2: GOVERNORATES ONLY ======================= */}
        <TabsContent value="governorates" className="space-y-4 animate-in mt-16 fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm gap-4 sm:gap-0">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Map className="text-primary w-5 h-5" /> Governorates List
            </h2>
            <Button onClick={openGovAdd} className="w-full sm:w-auto h-11 rounded-xl bg-primary hover:bg-primary/90 font-bold shadow-sm">
              <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Add Governorate
            </Button>
          </div>
          
          {isLoading && <div className="text-center py-12 text-slate-400 font-bold animate-pulse bg-white border border-slate-200/60 rounded-2xl shadow-sm">Loading...</div>}
          {!isLoading && governoratesList.length === 0 && <div className="text-center py-12 text-slate-500 font-bold bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">No governorates found.</div>}
          
          {!isLoading && governoratesList.length > 0 && (
            <>
              {/* Mobile Governorates Cards */}
              <div className="grid grid-cols-1 md:hidden gap-3">
                {governoratesList.map((gov) => (
                  <div key={gov.id} className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                      <div>
                        <h3 className="font-bold text-[15px] text-slate-800 leading-tight">{gov.name_en}</h3>
                        <p className="text-[12px] text-slate-500 mt-1">{gov.name_ar}</p>
                      </div>
                      <Badge variant={gov.is_active ? "default" : "secondary"} className={`text-[10px] font-bold ${gov.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none' : ''}`}>
                        {gov.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-9 rounded-lg px-4 text-[12px] font-bold" onClick={() => openGovEdit(gov)}>
                        <Edit className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Edit
                      </Button>
                      <Button variant="destructive" size="icon" className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border-none shadow-none" onClick={() => setDeleteItem({ type: 'gov', id: gov.id, name: gov.name_en })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Governorates Table */}
              <div className="hidden md:block bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-slate-600 py-4">Governorate (EN / AR)</TableHead>
                      <TableHead className="font-bold text-slate-600 py-4">Status</TableHead>
                      <TableHead className="text-right font-bold text-slate-600 py-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {governoratesList.map((gov) => (
                      <TableRow key={gov.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                        <TableCell className="font-medium py-3">
                          <span className="text-slate-800 font-bold block">{gov.name_en}</span>
                          <span className="text-xs text-slate-500 block mt-0.5">{gov.name_ar}</span>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant={gov.is_active ? "default" : "secondary"} className={`text-[11px] font-bold ${gov.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none' : ''}`}>
                            {gov.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-3 space-x-2 rtl:space-x-reverse">
                          <Button variant="outline" size="sm" className="h-9 rounded-xl font-bold text-slate-600" onClick={() => openGovEdit(gov)}>
                            <Edit className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Edit
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setDeleteItem({ type: 'gov', id: gov.id, name: gov.name_en })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        {/* ======================= TAB 3: ZONES ONLY ======================= */}
        <TabsContent value="zones" className="space-y-4 mt-16 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm gap-4 sm:gap-0">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="text-primary w-5 h-5" /> Zones List
            </h2>
            <Button onClick={() => openZoneAdd()} className="w-full sm:w-auto h-11 rounded-xl bg-primary hover:bg-primary/90 font-bold shadow-sm">
              <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Add Zone
            </Button>
          </div>

          {isLoading && <div className="text-center py-12 text-slate-400 font-bold animate-pulse bg-white border border-slate-200/60 rounded-2xl shadow-sm">Loading zones...</div>}
          {!isLoading && flatZonesList.length === 0 && <div className="text-center py-12 text-slate-500 font-bold bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">No zones found.</div>}
          
          {!isLoading && flatZonesList.length > 0 && (
            <>
              {/* Mobile Zones Cards */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {flatZonesList.map((zone) => {
                  const parentGov = governoratesList.find((g) => g.id === zone.governorate_id);
                  return (
                    <div key={zone.id} className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                        <div>
                          <h3 className="font-bold text-[15px] text-slate-800 leading-tight">{zone.name_en}</h3>
                          <p className="text-[12px] text-slate-500 mt-1">{zone.name_ar}</p>
                        </div>
                        <Badge variant={zone.is_active ? "outline" : "secondary"} className="text-[10px] font-bold">
                          {zone.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Governorate</span>
                          <span className="text-[13px] font-bold text-slate-700">{parentGov?.name_en || "N/A"}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg text-[12px] font-bold" onClick={() => openZoneEdit(zone)}>
                            <Edit className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Edit
                          </Button>
                          <Button variant="destructive" size="icon" className="h-9 w-9 shrink-0 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border-none shadow-none" onClick={() => setDeleteItem({ type: 'zone', id: zone.id, name: zone.name_en })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Zones Table */}
              <div className="hidden md:block bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-slate-600 py-4">Zone (EN / AR)</TableHead>
                      <TableHead className="font-bold text-slate-600 py-4">Governorate</TableHead>
                      <TableHead className="font-bold text-slate-600 py-4">Status</TableHead>
                      <TableHead className="text-right font-bold text-slate-600 py-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flatZonesList.map((zone) => {
                      const parentGov = governoratesList.find((g) => g.id === zone.governorate_id);
                      return (
                        <TableRow key={zone.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                          <TableCell className="font-medium py-3">
                            <span className="text-slate-800 font-bold block">{zone.name_en}</span>
                            <span className="text-xs text-slate-500 block mt-0.5">{zone.name_ar}</span>
                          </TableCell>
                          <TableCell className="py-3">
                            <span className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-[13px] font-bold text-slate-700 inline-block">
                              {parentGov?.name_en || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge variant={zone.is_active ? "outline" : "secondary"} className="text-[11px] font-bold">
                              {zone.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-3 space-x-2 rtl:space-x-reverse">
                            <Button variant="outline" size="sm" className="h-9 rounded-xl font-bold text-slate-600" onClick={() => openZoneEdit(zone)}>
                              <Edit className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> Edit
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setDeleteItem({ type: 'zone', id: zone.id, name: zone.name_en })}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>
        
      </Tabs>

      {/* ======================= GOVERNORATE MODAL ======================= */}
      <Dialog open={isGovModalOpen} onOpenChange={setIsGovModalOpen}>
        <DialogContent className="w-[95vw]  sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{selectedGov ? "Edit Governorate" : "Add Governorate"}</DialogTitle></DialogHeader>
          <form onSubmit={govForm.handleSubmit(onGovSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name (EN)</label>
                <Input {...govForm.register("name_en")} />
                {govForm.formState.errors.name_en && <span className="text-xs text-destructive">{govForm.formState.errors.name_en.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Name (AR)</label>
                <Input dir="rtl" {...govForm.register("name_ar")} />
                {govForm.formState.errors.name_ar && <span className="text-xs text-destructive">{govForm.formState.errors.name_ar.message}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="gov_active" className="w-4 h-4 cursor-pointer" {...govForm.register("is_active")} />
              <label htmlFor="gov_active" className="text-sm cursor-pointer select-none">Active Governorate</label>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsGovModalOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={isCreatingGov || isUpdatingGov} className="w-full sm:w-auto">
                {(isCreatingGov || isUpdatingGov) && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} 
                {selectedGov ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================= ZONE MODAL ======================= */}
      <Dialog open={isZoneModalOpen} onOpenChange={setIsZoneModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[400px]">
          <DialogHeader><DialogTitle>{selectedZone ? "Edit Zone" : "Add Zone"}</DialogTitle></DialogHeader>
          <form onSubmit={zoneForm.handleSubmit(onZoneSubmit)} className="space-y-4">
            
            <div>
              <label className="text-sm font-medium">Governorate</label>
              <select {...zoneForm.register("governorate_id", { valueAsNumber: true })} className="flex h-10 w-full border border-input bg-background px-3 py-2 text-sm">
                <option value={0} disabled>Select a governorate...</option>
                {governoratesList.map((g) => <option key={g.id} value={g.id}>{g.name_en} ({g.name_ar})</option>)}
              </select>
              {zoneForm.formState.errors.governorate_id && <span className="text-xs text-destructive">{zoneForm.formState.errors.governorate_id.message}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name (EN)</label>
                <Input {...zoneForm.register("name_en")} />
                {zoneForm.formState.errors.name_en && <span className="text-xs text-destructive">{zoneForm.formState.errors.name_en.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Name (AR)</label>
                <Input dir="rtl" {...zoneForm.register("name_ar")} />
                {zoneForm.formState.errors.name_ar && <span className="text-xs text-destructive">{zoneForm.formState.errors.name_ar.message}</span>}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Input {...zoneForm.register("notes")} />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="zone_active" className="w-4 h-4 cursor-pointer" {...zoneForm.register("is_active")} />
              <label htmlFor="zone_active" className="text-sm cursor-pointer select-none">Active Zone</label>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsZoneModalOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={isCreatingZone || isUpdatingZone} className="w-full sm:w-auto">
                {(isCreatingZone || isUpdatingZone) && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} 
                {selectedZone ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================= DELETE CONFIRMATION ======================= */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent className="w-[95vw] sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-bold text-foreground">{deleteItem?.name}</span> and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="mt-0 border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}