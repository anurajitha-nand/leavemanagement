import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Employee = {
  id: string;
  name: string;
  role: 'EMPLOYEE' | 'MANAGER';
  vacation_balance: number;
  sick_balance: number;
  email: string;
  created_at: string;
};

export type LeaveRequest = {
  id: string;
  employee_id: string;
  type: 'VACATION' | 'SICK';
  start_date: string;
  end_date: string;
  days: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  processed_by: string | null;
  created_at: string;
  updated_at: string;
  employee?: Employee;
  processor?: Employee;
};
