-- Status timestamps for tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS in_progress_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Dedupe due-date reminder emails (cron)
CREATE TABLE IF NOT EXISTS public.task_reminder_sent (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('due_in_7_days', 'due_in_1_day')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_task_reminder_sent_type
  ON public.task_reminder_sent(reminder_type);

ALTER TABLE public.task_reminder_sent ENABLE ROW LEVEL SECURITY;

-- Cron uses service role; no client policies needed
CREATE POLICY "task_reminder_sent_service_only" ON public.task_reminder_sent
  FOR ALL USING (false);
