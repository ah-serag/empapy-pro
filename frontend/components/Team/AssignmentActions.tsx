import React, { useState } from 'react';
import { useStartJobExecutionMutation  , useRevertAssignmentExecutionMutation} from '@/redux/features/TeamApiSlice';
import CompleteAssignmentForm from './CompleteAssignmentForm';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react'; 

interface AssignmentActionsProps {
  assignmentId: number;
  status: 'pending' | 'in_progress' | 'completed';
  initialMembers: any[];
}

export default function AssignmentActions({ assignmentId, status, initialMembers }: AssignmentActionsProps) {
  const [StartJobExecution] = useStartJobExecutionMutation();
  const [RevertAssignment] = useRevertAssignmentExecutionMutation();

  const [isCompleteFormOpen, setIsCompleteFormOpen] = useState<boolean>(false);
  
  const [actionLoading, setActionLoading] = useState<'start' | 'return' | null>(null);

  const handleStart = async () => {
    setActionLoading('start');
    try {
      await StartJobExecution( assignmentId).unwrap();
      toast.message('تم بدء المهمة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء بدء المهمة، تحقق من الاتصال.');
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturnStart = async () => {
    setActionLoading('return');
    try {
      await RevertAssignment( assignmentId).unwrap();
      toast.message('تم التراجع عن بدء المهمة.'); 
    } catch (error) {
      toast.error('حدث خطأ أثناء التراجع.');
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      {status === 'pending' && (
        <button 
          onClick={handleStart}
          disabled={actionLoading === 'start'}
          className="w-full py-2.5 bg-teal-600  text-white rounded-lg font-medium text-sm hover:bg-teal-700 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {actionLoading === 'start' ? <Loader2 size={18} className="animate-spin" /> : 'بدء المهمة'}
        </button>
      )}

      {status === 'in_progress' && (
        <div className='flex gap-2 flex-col'>
          
          <button 
            onClick={() => setIsCompleteFormOpen(true)}
            className="w-full py-2.5 bg-secondary text-white rounded-lg font-medium text-sm hover:bg-secondary/90 active:scale-[0.98] transition-all flex justify-center items-center"
          >
            اكتمال المهمة
          </button> 
          
          <button 
            onClick={handleReturnStart}
            disabled={actionLoading === 'return'}
            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {actionLoading === 'return' ? <Loader2 size={18} className="animate-spin" /> : 'الرجوع عن المهمة'}
          </button> 
        </div>
      )}

      {isCompleteFormOpen && (
        <CompleteAssignmentForm 
          assignmentId={assignmentId}
          initialMembers={initialMembers}
          onClose={() => setIsCompleteFormOpen(false)}
        />
      )}
    </>
  );
}