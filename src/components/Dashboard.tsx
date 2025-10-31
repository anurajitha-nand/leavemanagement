import { useState, useEffect } from 'react';
import { supabase, LeaveRequest, Employee } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SubmitLeaveRequest } from './SubmitLeaveRequest';
import { LeaveRequestCard } from './LeaveRequestCard';
import { LogOut, Plus, FileText, User } from 'lucide-react';

export function Dashboard() {
  const { employee, signOut } = useAuth();
  const [requests, setRequests] = useState<(LeaveRequest & { employee: Employee; processor?: Employee })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchRequests();
  }, [employee]);

  const fetchRequests = async () => {
    if (!employee) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employee:employees!leave_requests_employee_id_fkey(*),
          processor:employees!leave_requests_processed_by_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!employee || employee.role !== 'MANAGER') return;

    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({
          status: 'APPROVED',
          processed_by: employee.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      const balanceField = request.type === 'VACATION' ? 'vacation_balance' : 'sick_balance';
      const currentBalance = request.employee[balanceField];

      const { error: balanceError } = await supabase
        .from('employees')
        .update({ [balanceField]: currentBalance - request.days })
        .eq('id', request.employee_id);

      if (balanceError) throw balanceError;

      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!employee || employee.role !== 'MANAGER') return;

    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'REJECTED',
          processed_by: employee.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status.toLowerCase() === filter;
  });

  if (!employee) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Leave Management</h1>
                <p className="text-xs text-gray-500">{employee.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">{employee.name}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {employee.role === 'EMPLOYEE' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Leave Balance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Vacation Days</div>
                <div className="text-3xl font-bold text-blue-600">{employee.vacation_balance}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Sick Leave Days</div>
                <div className="text-3xl font-bold text-orange-600">{employee.sick_balance}</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Leave Requests</h2>
              <p className="text-sm text-gray-600 mt-1">
                {employee.role === 'MANAGER' ? 'Manage team leave requests' : 'View and manage your requests'}
              </p>
            </div>
            {employee.role === 'EMPLOYEE' && (
              <button
                onClick={() => setShowSubmitForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                New Request
              </button>
            )}
          </div>

          <div className="flex gap-2 mb-6">
            {['all', 'pending', 'approved', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No leave requests found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRequests.map((request) => (
                <LeaveRequestCard
                  key={request.id}
                  request={request}
                  isManager={employee.role === 'MANAGER'}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showSubmitForm && (
        <SubmitLeaveRequest
          onSuccess={() => {
            setShowSubmitForm(false);
            fetchRequests();
          }}
          onCancel={() => setShowSubmitForm(false)}
        />
      )}
    </div>
  );
}
