import React from 'react';
import { X, User, Phone, MapPin, Calendar, Clock, Map, FileText } from 'lucide-react';
import CopyButton from '../shared/copyButton'; // تأكد من مسار الاستيراد
import Link from 'next/link';

export interface BookingDetails {
  booking_ref: string;
  contact_name: string;
  contact_phone: string;
  address: string;
  location_url: string;
  preferred_date?: string;
  preferred_time?: string;
  customer_notes?: string;
}

export interface Assignment {
  assignment_id: number;
  assignment_status: 'pending' | 'in_progress' | 'completed';
  booking_details: BookingDetails;
  assignment_notes: string;
  team_details: {
    team_name: string;
    members: any[]; // تم التعديل لتجنب أخطاء TypeScript
  };
}

interface ViewDetailsModalProps {
  assignment: Assignment;
  onClose: () => void;
}

export default function ViewDetailsModal({ assignment, onClose }: ViewDetailsModalProps) {
  const { booking_details } = assignment;
  const noteAssinments = assignment.assignment_notes;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 scroll  flex items-center justify-center p-4">
      
      <div className="bg-white  rounded-lg w-full max-w-md shadow-sm overflow-hidden flex flex-col max-h-[90vh] " dir="rtl">
        
        <div className="flex justify-between items-center p-4 bg-secondary shrink-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-200">
            <span className="text-sm font-semibold text-gray-300">{booking_details.booking_ref}</span> 
            <CopyButton textToCopy={booking_details.booking_ref} />
          </h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 flex-1 overflow-y-auto">
          
          <div className="border border-gray-100 rounded-lg p-3 bg-gray-100">
            <div className="flex items-center gap-2 mb-2 text-gray-800">
              <User size={16} className="text-secondary" />
              <span className="font-medium text-sm">{booking_details.contact_name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-800">
              <Phone size={16} className="text-secondary" />
              <span className="font-medium text-sm" dir="ltr">{booking_details.contact_phone}</span>
              <CopyButton textToCopy={booking_details.contact_phone} />
            </div>
          </div>

          {/* العنوان */}
          <div className="border border-gray-100 rounded-lg p-3 bg-gray-100">
            <div className="flex gap-2 text-gray-800">
              <MapPin size={16} className="text-secondary shrink-0 mt-0.5" />
              <span className="text-sm leading-relaxed">{booking_details.address}</span>
            </div>
          </div>

          {/* رابط الخريطة */}
          {booking_details.location_url && (
            <div className="border border-gray-100 rounded-lg p-3 bg-gray-100">
              <div className="flex items-center gap-2 text-gray-800">
                <Map size={16} className="text-secondary shrink-0" />
                <Link 
                  target="_blank" 
                  href={booking_details.location_url} 
                  className="text-sm font-normal text-blue-900 hover:text-blue-800 underline leading-relaxed"
                >
                  خريطة جوجل
                </Link>
              </div>
            </div>
          )}
    
          {/* الموعد */}
          {(booking_details.preferred_date || booking_details.preferred_time) && (
            <div className="flex gap-3">
              {booking_details.preferred_date && (
                <div className="flex-1 border border-gray-100 rounded-lg p-3 bg-gray-100 flex items-center gap-2 text-gray-800">
                  <Calendar size={16} className="text-secondary" />
                  <span className="text-sm font-medium">{booking_details.preferred_date}</span>
                </div>
              )}
              {booking_details.preferred_time && (
                <div className="flex-1 border border-gray-100 rounded-lg p-3 bg-gray-100 flex items-center gap-2 text-gray-800">
                  <Clock size={16} className="text-secondary" />
                  <span className="text-sm font-medium">{booking_details.preferred_time}</span>
                </div>
              )}
            </div>
          )}

          {/* ملاحظات العميل */}
          {booking_details.customer_notes && (
            <div className="border border-gray-100 rounded-lg p-3 bg-blue-50/30 overflow-hidden">
              <div className="flex items-center gap-2 mb-1 text-gray-700">
                <FileText size={16} className="text-secondary shrink-0" />
                <span className="text-sm font-semibold">ملاحظات العميل</span>
              </div>
              <p className="text-sm w-full text-gray-600 leading-relaxed pr-6 break-words whitespace-pre-wrap">
                {booking_details.customer_notes}
              </p>
            </div>
          )}

          {/* ملاحظات الشركة */}
          {noteAssinments && (
            <div className="border border-gray-100 rounded-lg p-3 bg-blue-50/30 overflow-hidden">
              <div className="flex items-center gap-2 mb-1 text-gray-700">
                <FileText size={16} className="text-secondary shrink-0" />
                <span className="text-sm font-semibold">ملاحظات الشركة</span>
              </div>
              <p className="text-sm w-full text-gray-600 leading-relaxed pr-6 break-words whitespace-pre-wrap">
                {noteAssinments}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}