-- supabase/schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'manager', 'admin')),
  department TEXT,
  manager_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. goal_cycles table
CREATE TABLE public.goal_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phase1_open BOOLEAN DEFAULT false,
  q1_open BOOLEAN DEFAULT false,
  q2_open BOOLEAN DEFAULT false,
  q3_open BOOLEAN DEFAULT false,
  q4_open BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.goal_cycles(id) ON DELETE CASCADE,
  thrust_area TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  uom_type TEXT NOT NULL CHECK (uom_type IN ('numeric_min', 'numeric_max', 'timeline', 'zero')),
  target_value NUMERIC,
  target_date DATE,
  weightage NUMERIC NOT NULL CHECK (weightage >= 10 AND weightage <= 100),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rework', 'locked')),
  is_shared BOOLEAN DEFAULT false,
  shared_from_id UUID REFERENCES public.goals(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. goal_achievements table
CREATE TABLE public.goal_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4', 'Annual')),
  actual_value NUMERIC,
  actual_date DATE,
  progress_status TEXT NOT NULL CHECK (progress_status IN ('not_started', 'on_track', 'completed')),
  computed_score FLOAT,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, quarter)
);

-- 5. checkin_comments table
CREATE TABLE public.checkin_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.profiles(id),
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4', 'Annual')),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. audit_log table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES public.goals(id),
  changed_by UUID REFERENCES public.profiles(id),
  change_type TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. escalation_rules table
CREATE TABLE public.escalation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trigger_type TEXT NOT NULL,
  threshold_days INT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Functions for RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can read all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Goal Cycles Policies
CREATE POLICY "Everyone can read goal cycles" ON public.goal_cycles FOR SELECT USING (true);
CREATE POLICY "Admins can manage goal cycles" ON public.goal_cycles FOR ALL USING (public.get_my_role() = 'admin');

-- Goals Policies
CREATE POLICY "Employees can read their own goals" ON public.goals FOR SELECT USING (auth.uid() = employee_id OR public.get_my_role() = 'admin');
CREATE POLICY "Managers can read direct reports goals" ON public.goals FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = public.goals.employee_id AND p.manager_id = auth.uid()
  )
);
CREATE POLICY "Employees can create their own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = employee_id);
CREATE POLICY "Employees can update their own draft/rework goals" ON public.goals FOR UPDATE USING (auth.uid() = employee_id AND status IN ('draft', 'rework'));
CREATE POLICY "Managers can update submitted goals of direct reports" ON public.goals FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = public.goals.employee_id AND p.manager_id = auth.uid()
  ) AND status IN ('submitted', 'approved', 'rework')
);
CREATE POLICY "Admins can manage all goals" ON public.goals FOR ALL USING (public.get_my_role() = 'admin');

-- Goal Achievements Policies
CREATE POLICY "Employees can manage their own achievements" ON public.goal_achievements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.employee_id = auth.uid())
);
CREATE POLICY "Managers can read direct reports achievements" ON public.goal_achievements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.goals g
    JOIN public.profiles p ON g.employee_id = p.id
    WHERE g.id = goal_id AND p.manager_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all achievements" ON public.goal_achievements FOR ALL USING (public.get_my_role() = 'admin');

-- Checkin Comments Policies
CREATE POLICY "Users can read related comments" ON public.checkin_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.employee_id = auth.uid()) OR
  manager_id = auth.uid() OR
  public.get_my_role() = 'admin'
);
CREATE POLICY "Managers can insert comments" ON public.checkin_comments FOR INSERT WITH CHECK (manager_id = auth.uid());
CREATE POLICY "Admins can manage comments" ON public.checkin_comments FOR ALL USING (public.get_my_role() = 'admin');

-- Audit Log Policies
CREATE POLICY "Admins can read audit log" ON public.audit_log FOR SELECT USING (public.get_my_role() = 'admin');
CREATE POLICY "System can insert audit log" ON public.audit_log FOR INSERT WITH CHECK (true);

-- Escalation Rules Policies
CREATE POLICY "Admins can manage escalation rules" ON public.escalation_rules FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Everyone can read escalation rules" ON public.escalation_rules FOR SELECT USING (true);

-- Notifications Policies
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
