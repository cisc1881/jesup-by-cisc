-- Phase 3A: provider-neutral AI interaction audit ledger.
-- Stores operational metadata only. User prompts and model responses are not persisted.

CREATE TYPE public.ai_interaction_status AS ENUM ('started', 'completed', 'failed', 'blocked');

CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic')),
  model TEXT NOT NULL,
  status public.ai_interaction_status NOT NULL DEFAULT 'started',
  request_id TEXT,
  input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  error_code TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT ai_interactions_no_content
    CHECK (NOT (metadata ?| ARRAY['prompt', 'response', 'messages', 'content']))
);

COMMENT ON TABLE public.ai_interactions IS
  'AI audit metadata. Prompts and generated content must never be stored in this table.';

CREATE INDEX idx_ai_interactions_user_created ON public.ai_interactions (user_id, created_at DESC);
CREATE INDEX idx_ai_interactions_feature_created ON public.ai_interactions (feature, created_at DESC);

ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai interactions select own or admin"
  ON public.ai_interactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.ai_interactions TO authenticated;
GRANT ALL ON public.ai_interactions TO service_role;
