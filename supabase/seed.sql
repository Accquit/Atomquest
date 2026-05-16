-- ============================================================
-- AUTO-SEED: Run this ENTIRE script in Supabase SQL Editor
-- It creates profiles for already-created auth users.
-- 
-- FIRST: Go to Authentication > Users > Add User (invite) and create:
--   employee@demo.com  (password: password123)
--   manager@demo.com   (password: password123)
--   admin@demo.com     (password: password123)
--   emp2@demo.com      (password: password123)
--   emp3@demo.com      (password: password123)
--   emp4@demo.com      (password: password123)
--   emp5@demo.com      (password: password123)
--   manager2@demo.com  (password: password123)
--
-- THEN run this script to link profiles, goals, cycles, etc.
-- ============================================================

-- Helper: Create profiles from existing auth users by email
DO $$
DECLARE
  v_admin_id uuid;
  v_manager1_id uuid;
  v_manager2_id uuid;
  v_emp1_id uuid;
  v_emp2_id uuid;
  v_emp3_id uuid;
  v_emp4_id uuid;
  v_emp5_id uuid;
  v_cycle_id uuid := gen_random_uuid();
BEGIN

  -- Get user IDs from auth.users
  SELECT id INTO v_admin_id    FROM auth.users WHERE email = 'admin@demo.com'    LIMIT 1;
  SELECT id INTO v_manager1_id FROM auth.users WHERE email = 'manager@demo.com'  LIMIT 1;
  SELECT id INTO v_manager2_id FROM auth.users WHERE email = 'manager2@demo.com' LIMIT 1;
  SELECT id INTO v_emp1_id     FROM auth.users WHERE email = 'employee@demo.com' LIMIT 1;
  SELECT id INTO v_emp2_id     FROM auth.users WHERE email = 'emp2@demo.com'     LIMIT 1;
  SELECT id INTO v_emp3_id     FROM auth.users WHERE email = 'emp3@demo.com'     LIMIT 1;
  SELECT id INTO v_emp4_id     FROM auth.users WHERE email = 'emp4@demo.com'     LIMIT 1;
  SELECT id INTO v_emp5_id     FROM auth.users WHERE email = 'emp5@demo.com'     LIMIT 1;

  -- Guard: stop if users not found
  IF v_admin_id IS NULL THEN RAISE EXCEPTION 'admin@demo.com not found in auth.users. Create the user first.'; END IF;
  IF v_manager1_id IS NULL THEN RAISE EXCEPTION 'manager@demo.com not found.'; END IF;
  IF v_emp1_id IS NULL THEN RAISE EXCEPTION 'employee@demo.com not found.'; END IF;

  -- Insert profiles (managers first, no manager_id)
  INSERT INTO public.profiles (id, full_name, role, department)
  VALUES
    (v_admin_id,    'Admin Sarah Chen',    'admin',   'HR & Operations'),
    (v_manager1_id, 'Manager Alex Kumar',  'manager', 'Engineering'),
    (v_manager2_id, 'Manager Priya Singh', 'manager', 'Sales')
  ON CONFLICT (id) DO NOTHING;

  -- Insert employees linked to managers
  INSERT INTO public.profiles (id, full_name, role, department, manager_id)
  VALUES
    (v_emp1_id, 'Alice Johnson',  'employee', 'Engineering', v_manager1_id),
    (v_emp2_id, 'Bob Smith',      'employee', 'Engineering', v_manager1_id),
    (v_emp3_id, 'Carol White',    'employee', 'Engineering', v_manager1_id),
    (v_emp4_id, 'David Lee',      'employee', 'Sales',       v_manager2_id),
    (v_emp5_id, 'Eva Martinez',   'employee', 'Sales',       v_manager2_id)
  ON CONFLICT (id) DO NOTHING;

  -- Create active goal cycle
  INSERT INTO public.goal_cycles (id, name, phase1_open, q1_open, q2_open, q3_open, q4_open, is_active)
  VALUES (v_cycle_id, 'FY 2025-26', true, true, false, false, false, true)
  ON CONFLICT DO NOTHING;

  -- Goals for Alice (approved, varied UoM types)
  INSERT INTO public.goals (employee_id, cycle_id, thrust_area, title, description, uom_type, target_value, target_date, weightage, status) VALUES
    (v_emp1_id, v_cycle_id, 'Financial',        'Increase pipeline by 20%',    'Grow qualified sales pipeline value', 'numeric_min', 120, NULL,         30, 'approved'),
    (v_emp1_id, v_cycle_id, 'Customer',         'Maintain NPS above 8',        'Net Promoter Score target',           'numeric_min', 8,   NULL,         25, 'approved'),
    (v_emp1_id, v_cycle_id, 'Internal Process', 'Code review SLA compliance',  'Complete reviews within 48h',         'numeric_min', 95,  NULL,         25, 'approved'),
    (v_emp1_id, v_cycle_id, 'Learning & Growth','Complete AWS Certification',   'AWS Solutions Architect Associate',   'timeline',    NULL,'2025-09-30', 20, 'approved');

  -- Goals for Bob (submitted)
  INSERT INTO public.goals (employee_id, cycle_id, thrust_area, title, description, uom_type, target_value, weightage, status) VALUES
    (v_emp2_id, v_cycle_id, 'Financial',        'Reduce infra costs by 15%',   'Cloud infrastructure optimization',   'numeric_max', 85,  40, 'submitted'),
    (v_emp2_id, v_cycle_id, 'Internal Process', 'Zero critical prod incidents', 'Maintain zero critical bugs',         'zero',        0,   30, 'submitted'),
    (v_emp2_id, v_cycle_id, 'Learning & Growth','Complete 5 tech workshops',    'Internal knowledge sharing sessions', 'numeric_min', 5,   30, 'submitted');

  -- Goals for David (draft)
  INSERT INTO public.goals (employee_id, cycle_id, thrust_area, title, description, uom_type, target_value, weightage, status) VALUES
    (v_emp4_id, v_cycle_id, 'Financial',  'Achieve $500K in quarterly sales', 'Direct revenue target', 'numeric_min', 500000, 50, 'draft'),
    (v_emp4_id, v_cycle_id, 'Customer',   'Close 10 new enterprise accounts',  'Net new logo acquisition', 'numeric_min', 10, 30, 'draft'),
    (v_emp4_id, v_cycle_id, 'Learning & Growth', 'Complete Sales Excellence training', 'Mandatory L&D program', 'timeline', NULL, 20, 'draft');

  -- Q1 Achievements for Alice's goals
  INSERT INTO public.goal_achievements (goal_id, quarter, actual_value, progress_status, computed_score)
  SELECT id, 'Q1', 95, 'on_track', 0.79
  FROM public.goals WHERE employee_id = v_emp1_id AND thrust_area = 'Financial' LIMIT 1;

  INSERT INTO public.goal_achievements (goal_id, quarter, actual_value, progress_status, computed_score)
  SELECT id, 'Q1', 8.5, 'completed', 1.0
  FROM public.goals WHERE employee_id = v_emp1_id AND thrust_area = 'Customer' LIMIT 1;

  -- Escalation rules
  INSERT INTO public.escalation_rules (trigger_type, threshold_days, active) VALUES
    ('goal_not_submitted',    7,  true),
    ('manager_not_approved',  5,  true),
    ('checkin_not_done',      3,  true);

  -- Notifications for demo users
  IF v_emp1_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, message, link, is_read) VALUES
      (v_emp1_id, 'Your goals have been approved by Manager Alex!', '/employee/goals', false),
      (v_emp1_id, 'Q1 check-in window is now open. Log your progress.', '/employee/checkins', false);
  END IF;

  IF v_manager1_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, message, link, is_read) VALUES
      (v_manager1_id, 'Bob Smith has submitted goals for your review.', '/manager/team', false),
      (v_manager1_id, 'Q1 check-in window is open. Review your team.', '/manager/checkins', false);
  END IF;

  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, message, link, is_read) VALUES
      (v_admin_id, 'FY 2025-26 cycle is active. Phase 1 and Q1 are open.', '/admin/cycles', true),
      (v_admin_id, 'Escalation: David Lee has not submitted goals (7+ days).', '/admin/escalations', false);
  END IF;

END $$;

-- ============================================================
-- Audit Log Trigger (log all goal status changes)
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_goal_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_log (goal_id, changed_by, change_type, old_value, new_value)
    VALUES (
      NEW.id,
      auth.uid(),
      'status_change',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS goal_status_audit ON public.goals;
CREATE TRIGGER goal_status_audit
AFTER UPDATE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.log_goal_changes();
