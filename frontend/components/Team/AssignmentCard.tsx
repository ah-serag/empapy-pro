import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import AssignmentActions from './AssignmentActions';
import ViewDetailsModal, { Assignment } from './ViewDetailsModal';

interface AssignmentCardProps {
  assignment: Assignment;
}

export default function AssignmentCard({ assignment }: AssignmentCardProps) {
  const { 
    assignment_id, 
    assignment_status, 
    booking_details,
    team_details 
  } = assignment;

  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);

  if (assignment_status === 'completed') return null;

  return (
    <div className="border border-gray-200 rounded-lg  shadow-sm  bg-white flex flex-col gap-3 mb-3" dir="rtl">
      
      <div className="flex justify-between bg-primary rounded-t-lg  p-4 items-center   pb-2">
        <span className="text-sm text-gray-200 font-medium">
         رقم الحجز : {booking_details.booking_ref}
        </span>
        <button 
          onClick={() => setIsViewModalOpen(true)}
          className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
          title="عرض التفاصيل"
        >
          <Eye size={20} />
        </button>
      </div>

      <div className="flex flex-col p-4 gap-1">
        <p className="text-gray-900 font-semibold text-sm">{booking_details.contact_name}</p>
        <p className="text-sm text-gray-600" >{booking_details.contact_phone}</p>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
          {booking_details.address}
        </p>
      </div>

      <div className="mt-2 p-4 pt-2 border-t border-gray-100">
        <AssignmentActions 
          assignmentId={assignment_id} 
          status={assignment_status} 
          initialMembers={team_details.members}
        />
      </div>

      {isViewModalOpen && (
        <ViewDetailsModal 
          assignment={assignment} 
          onClose={() => setIsViewModalOpen(false)} 
        />
      )}
    </div>
  );
}