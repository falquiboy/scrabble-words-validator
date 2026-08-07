-- Create retry queue table for quick mode
CREATE TABLE public.retry_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  word TEXT NOT NULL,
  word_group INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, word, word_group)
);

-- Enable RLS
ALTER TABLE public.retry_queue ENABLE ROW LEVEL SECURITY;

-- Users can only see their own retry queue
CREATE POLICY "Users can view their own retry queue"
ON public.retry_queue FOR SELECT
USING (auth.uid() = user_id);

-- Users can add to their own retry queue
CREATE POLICY "Users can add to their own retry queue"
ON public.retry_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete from their own retry queue
CREATE POLICY "Users can delete from their own retry queue"
ON public.retry_queue FOR DELETE
USING (auth.uid() = user_id);

-- Add quick_mode preference to user_progress
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS quick_mode BOOLEAN DEFAULT false;

-- Create index for efficient queries
CREATE INDEX idx_retry_queue_user_group ON public.retry_queue(user_id, word_group);
