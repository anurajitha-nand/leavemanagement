import { LeaveRequest, Employee } from '../lib/supabase';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

interface LeaveRequestCardProps {
  request: LeaveRequest & { employee: Employee; processor?: Employee };
  isManager: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function LeaveRequestCard({ request, isManager, onApprove, onReject }: LeaveRequestCardProps) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    APPROVED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
  };

  const typeColors = {
    VACATION: 'bg-blue-100 text-blue-800',
    SICK: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">{request.employee.name}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[request.type]}`}>
              {request.type}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{new Date(request.start_date).toLocaleDateString()}</span>
            </div>
            <span>→</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{new Date(request.end_date).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-2">
            <Clock className="w-4 h-4" />
            <span>{request.days} {request.days === 1 ? 'day' : 'days'}</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${statusColors[request.status]}`}>
          {request.status}
        </span>
      </div>

      {request.processor && (
        <div className="text-xs text-gray-500 mb-3">
          Processed by: {request.processor.name}
        </div>
      )}

      {isManager && request.status === 'PENDING' && (
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onApprove?.(request.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </button>
          <button
            onClick={() => onReject?.(request.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
