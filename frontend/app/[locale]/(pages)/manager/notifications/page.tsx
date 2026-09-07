"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { 
  useGetAllNotificationsQuery, 
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation
} from "@/redux/features/notificationApiSlice";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Bell, 
  CheckCheck, 
  Info,
  ChevronLeft,
  ChevronRight,
  MailOpen,
  Trash2
} from "lucide-react";
import CopyButton from "@/components/shared/copyButton";

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const locale = useLocale();

  const [currentPage, setCurrentPage] = useState(1);
  const [readFilter, setReadFilter] = useState("all"); 
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const limit = 10;

  // جلب البيانات
  const { data: notificationsResponse, isLoading, isError } = useGetAllNotificationsQuery({
    page: currentPage,
    limit,
    is_read: readFilter,
  });

  // الدوال (Mutations)
  const [markAsRead, { isLoading: isMarking }] = useMarkAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [deleteAllNotifications, { isLoading: isDeletingAll }] = useDeleteAllNotificationsMutation();

  const notifications = notificationsResponse?.data || [];
  const pagination = notificationsResponse?.pagination;

  // دالة مساعدة لقراءة النص حسب اللغة
  const getLocalizedText = (field: any) => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[locale] || field.en || "";
  };

  const handleMarkSingleAsRead = async (id: number) => {
    try {
      await markAsRead({ id }).unwrap();
    } catch (error) {
      toast.error(t("toasts.markReadError"));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAsRead({}).unwrap();
      toast.success(t("toasts.markAllReadSuccess"));
    } catch (error) {
      toast.error(t("toasts.actionError"));
    }
  };

  const handleDeleteSingle = async (id: number) => {
    try {
      await deleteNotification(id).unwrap();
      toast.success(t("toasts.deleteSuccess"));
    } catch (error) {
      toast.error(t("toasts.deleteError"));
    }
  };

  const executeDeleteAll = async () => {
    try {
      await deleteAllNotifications(undefined).unwrap();
      toast.success(t("toasts.deleteAllSuccess"));
      setIsDeleteAllDialogOpen(false);
      setCurrentPage(1);
    } catch (error) {
      toast.error(t("toasts.deleteError"));
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 min-h-screen text-slate-900 bg-white">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-primary flex items-center gap-3">
            <Bell className="h-7 w-7 text-primary" />
            {t("header.title")}
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-light">
            {t("header.subtitle")}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="rounded-xl shadow-sm border-slate-200 hover:bg-slate-50 flex-1 md:flex-none h-11 px-4"
            onClick={handleMarkAllAsRead}
            disabled={isMarking || notifications.length === 0}
          >
            <CheckCheck className="h-4 w-4 mx-2" />
            {t("buttons.markAllAsRead")}
          </Button>
          <Button 
            variant="default" 
            className="rounded-xl shadow-sm bg-primary text-white hover:bg-red-700 flex-1 md:flex-none h-11 px-4"
            onClick={() => setIsDeleteAllDialogOpen(true)}
            disabled={isDeletingAll || notifications.length === 0}
          >
            <Trash2 className="h-4 w-4 mx-2" />
            {t("buttons.deleteAll")}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" value={readFilter} onValueChange={(val) => {
        setReadFilter(val);
        setCurrentPage(1);
      }}>
        <TabsList className="bg-slate-50 border border-slate-100 p-1.5 rounded-2xl h-12 shadow-sm">
          <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-full font-medium">{t("tabs.all")}</TabsTrigger>
          <TabsTrigger value="false" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-full font-medium">{t("tabs.unread")}</TabsTrigger>
          <TabsTrigger value="true" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-full font-medium">{t("tabs.read")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400 font-light">{t("states.loading")}</div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500 font-light">{t("states.error")}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col items-center shadow-sm">
            <MailOpen className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-light text-lg">{t("states.empty")}</p>
          </div>
        ) : (
          notifications.map((notification: any) => (
            <div 
              key={notification.id} 
              className={`group p-5 rounded-2xl flex gap-5 items-start transition-all duration-300 border shadow-sm ${
                notification.is_read 
                  ? "bg-white border-slate-100 hover:border-slate-200" 
                  : "bg-primary/5 border-primary/20 shadow-md"
              }`}
            >
              <div className={`p-3 rounded-2xl flex-shrink-0 ${notification.is_read ? 'bg-slate-50' : 'bg-white shadow-sm border border-blue-50'}`}>
                <Info className={`h-5 w-5 ${notification.is_read ? 'text-slate-400' : 'text-primary'}`} />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
                  <h3 className={`font-medium text-base ${notification.is_read ? 'text-slate-700' : 'text-primary'}`}>
                    {getLocalizedText(notification.title)}
                  </h3>
                  <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full shadow-xs">
                    {new Date(notification.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-sm font-light">
                  {getLocalizedText(notification.message)}
                  <CopyButton textToCopy={getLocalizedText(notification.message)} />
                </p>
              </div>

              {/* Actions for single notification */}
              <div className="flex flex-col gap-2 items-center justify-center flex-shrink-0">
                {!notification.is_read && (
                  <button 
                    className="h-9 w-9 text-blue-600 hover:text-blue-800 flex items-center justify-center bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors shadow-xs"
                    onClick={() => handleMarkSingleAsRead(notification.id)}
                    title="Mark as read"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                <button 
                  className="h-9 w-9 text-slate-300 hover:text-red-600 flex items-center justify-center hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                  onClick={() => handleDeleteSingle(notification.id)}
                  title="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
          <p className="text-sm text-slate-500 font-light">
            {t("pagination.showing")} <span className="font-medium text-slate-900">{pagination.current_page}</span> {t("pagination.of")} <span className="font-medium text-slate-900">{pagination.total_pages}</span>
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl shadow-sm border-slate-200 h-10 px-4"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mx-1" /> {t("pagination.prev")}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl shadow-sm border-slate-200 h-10 px-4"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.total_pages))} 
              disabled={currentPage === pagination.total_pages}
            >
              {t("pagination.next")} <ChevronRight className="h-4 w-4 mx-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete All Dialog */}
      <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl shadow-2xl border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="font-medium pt-2 text-xl text-red-600">{t("dialogs.deleteAllTitle")}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-slate-500 font-light">{t("dialogs.deleteAllDesc")}</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteAllDialogOpen(false)} className="rounded-xl shadow-sm border-slate-200 w-full sm:w-auto h-11">
              {t("buttons.cancel")}
            </Button>
            <Button onClick={executeDeleteAll} className="rounded-xl shadow-sm bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto h-11">
              {t("buttons.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}