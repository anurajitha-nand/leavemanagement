/*
  # Leave Management System Schema

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `role` (text, either EMPLOYEE or MANAGER)
      - `vacation_balance` (integer, defaults to 20)
      - `sick_balance` (integer, defaults to 5)
      - `email` (text, unique, links to auth)
      - `created_at` (timestamp)
    
    - `leave_requests`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `type` (text, VACATION or SICK)
      - `start_date` (date)
      - `end_date` (date)
      - `days` (integer)
      - `status` (text, PENDING/APPROVED/REJECTED)
      - `processed_by` (uuid, foreign key to employees, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Employees can view their own data
    - Employees can submit leave requests
    - Employees can view their own leave requests
    - Managers can view all leave requests
    - Managers can approve/reject requests
    - Managers can view all employees
*/

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('EMPLOYEE', 'MANAGER')),
  vacation_balance integer DEFAULT 20,
  sick_balance integer DEFAULT 5,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('VACATION', 'SICK')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  processed_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own data"
  ON employees FOR SELECT
  TO authenticated
  USING (auth.uid()::text = email OR EXISTS (
    SELECT 1 FROM employees WHERE employees.email = auth.uid()::text AND employees.role = 'MANAGER'
  ));

CREATE POLICY "Managers can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees WHERE employees.email = auth.uid()::text AND employees.role = 'MANAGER'
  ));

CREATE POLICY "Employees can view own leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE email = auth.uid()::text)
    OR EXISTS (
      SELECT 1 FROM employees WHERE employees.email = auth.uid()::text AND employees.role = 'MANAGER'
    )
  );

CREATE POLICY "Employees can submit leave requests"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE email = auth.uid()::text)
  );

CREATE POLICY "Managers can update leave requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees WHERE employees.email = auth.uid()::text AND employees.role = 'MANAGER'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM employees WHERE employees.email = auth.uid()::text AND employees.role = 'MANAGER'
  ));

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);