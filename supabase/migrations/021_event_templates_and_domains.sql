-- 021_event_templates_and_domains.sql
-- Event Templates System & Domain Management
-- Target: Full UI/UX template system + subdomain management

-- 1. EVENT TEMPLATES (Full UI/UX Template System)
CREATE TABLE IF NOT EXISTS public.event_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                           -- "Paskibra Classic", "Modern Minimal"
  description TEXT,
  preview_image_url TEXT,
  category TEXT DEFAULT 'paskibra',             -- 'paskibra', 'generic', 'sports', 'academic'
  -- Theme System (Design Tokens)
  theme_tokens JSONB DEFAULT '{}',              -- { colors: {}, fonts: {}, spacing: {}, radii: {} }
  -- Layout System
  layout_variant TEXT DEFAULT 'default',        -- 'default', 'modern', 'classic', 'compact'
  hero_variant TEXT DEFAULT 'default',          -- 'split', 'centered', 'fullscreen', 'video'
  component_registry JSONB DEFAULT '{}',        -- component prop overrides
  -- CMS & Content
  cms_sections JSONB DEFAULT '[]',              -- Default CMS sections structure
  default_settings JSONB DEFAULT '{}',          -- prices, limits, features
  branding_assets JSONB DEFAULT '{}',           -- default logos, placeholder images
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EVENT DOMAINS (Subdomain Management)
-- Catatan: tabel dibuat di 018; di sini tambah kolom yang kurang (idempoten).
CREATE TABLE IF NOT EXISTS public.event_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,          -- "paskibra1.lkbb.my.id"
  subdomain TEXT,                       -- "paskibra1" (extracted)
  is_primary BOOLEAN DEFAULT false,
  ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending','active','failed','expired')),
  ssl_expires_at TIMESTAMPTZ,
  verification_token TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.event_domains ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE public.event_domains ADD COLUMN IF NOT EXISTS ssl_status TEXT DEFAULT 'pending';
ALTER TABLE public.event_domains ADD COLUMN IF NOT EXISTS ssl_expires_at TIMESTAMPTZ;
ALTER TABLE public.event_domains ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE public.event_domains ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.event_domains ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Kolom pelengkap bila tabel event_templates sudah terlanjur dibuat minimal
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS preview_image_url TEXT;
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'paskibra';
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS theme_tokens JSONB DEFAULT '{}';
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS layout_variant TEXT DEFAULT 'default';
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS hero_variant TEXT DEFAULT 'default';
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS component_registry JSONB DEFAULT '{}';
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS cms_sections JSONB DEFAULT '[]';
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS default_settings JSONB DEFAULT '{}';
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS branding_assets JSONB DEFAULT '{}';
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.event_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 6. FINANCIAL AGGREGATES (Super Admin Dashboard)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.financial_aggregates AS
SELECT 
  e.id as event_id,
  e.name as event_name,
  e.slug,
  COUNT(DISTINCT t.id) as total_transactions,
  SUM(t.amount) as total_revenue,
  SUM(CASE WHEN t.status='Success' THEN t.amount ELSE 0 END) as verified_revenue,
  SUM(CASE WHEN t.status='Pending' THEN t.amount ELSE 0 END) as pending_revenue,
  COUNT(DISTINCT t.user_id) as unique_payers,
  MAX(t.created_at) as last_transaction_at
FROM public.transactions t
JOIN public.events e ON t.event_id = e.id
WHERE t.event_id IS NOT NULL
GROUP BY e.id, e.name, e.slug;

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_aggregates_event_id ON public.financial_aggregates(event_id);

-- 7. EVENT TEMPLATE ASSIGNMENTS (add to events table)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.event_templates(id),
ADD COLUMN IF NOT EXISTS template_config JSONB DEFAULT '{}';

-- Kolom umum lain yang dipakai kode (idempoten)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS component_registry JSONB DEFAULT '{}';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}';

-- 8. TRANSACTION external id per event + UNIQUE CONSTRAINT
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS external_transaction_id TEXT;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_event_external_id_unique'
  ) THEN
    ALTER TABLE public.transactions 
    ADD CONSTRAINT transactions_event_external_id_unique 
    UNIQUE (event_id, external_transaction_id);
  END IF;
END $$;

-- 9. EVENT TEMPLATES RLS
ALTER TABLE public.event_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "templates_public_read" ON public.event_templates;
CREATE POLICY "templates_public_read" ON public.event_templates
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "templates_super_admin_all" ON public.event_templates;
CREATE POLICY "templates_super_admin_all" ON public.event_templates
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- EVENT DOMAINS RLS
ALTER TABLE public.event_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "domains_public_verified" ON public.event_domains;
CREATE POLICY "domains_public_verified" ON public.event_domains
  FOR SELECT USING (ssl_status = 'active');

DROP POLICY IF EXISTS "domains_super_admin_all" ON public.event_domains;
CREATE POLICY "domains_super_admin_all" ON public.event_domains
  FOR ALL USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "domains_admin_own" ON public.event_domains;
CREATE POLICY "domains_admin_own" ON public.event_domains
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.event_members 
            WHERE event_id = event_domains.event_id 
            AND user_id = auth.uid() 
            AND role = 'ADMIN' AND status = 'active')
  );

-- FINANCIAL AGGREGATES RLS (Super Admin only)
-- Materialized views don't support RLS directly, access controlled via API

-- 10. EVENT TEMPLATE ASSIGNMENT RLS (via events table)
-- Events table already has RLS, template_id inherits event RLS

-- 11. FUNCTIONS FOR TEMPLATE APPLICATION
CREATE OR REPLACE FUNCTION public.apply_template_to_event(p_event_id UUID, p_template_id UUID, p_overrides JSONB DEFAULT '{}')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_template RECORD;
  v_merged_config JSONB;
BEGIN
  -- Get template
  SELECT * INTO v_template FROM public.event_templates WHERE id = p_template_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or inactive';
  END IF;

  -- Merge config: template config + overrides
  v_merged_config := jsonb_build_object(
    'themeTokens', v_template.theme_tokens,
    'layoutVariant', v_template.layout_variant,
    'heroVariant', v_template.hero_variant,
    'componentRegistry', v_template.component_registry,
    'cmsSections', v_template.cms_sections,
    'defaultSettings', v_template.default_settings,
    'brandingAssets', v_template.branding_assets,
    'layoutVariant', v_template.layout_variant,
    'heroVariant', v_template.hero_variant
  ) || p_overrides;

  -- Apply to event
  UPDATE public.events SET
    template_id = p_template_id,
    template_config = v_merged_config,
    component_registry = (SELECT component_registry FROM public.event_templates WHERE id = p_template_id),
    branding = (SELECT theme_tokens FROM public.event_templates WHERE id = p_template_id),
    settings = (SELECT default_settings FROM public.event_templates WHERE id = p_template_id)
  WHERE id = p_event_id;

  -- Apply CMS sections from template
  DELETE FROM public.cms_sections WHERE page_id IN (
    SELECT id FROM public.cms_pages WHERE event_id = p_event_id
  );
  
  INSERT INTO public.cms_sections (page_id, key, title, type, is_visible, sort_order, settings, content, event_id, created_by)
  SELECT 
    p.id,
    s->>'key',
    s->>'title',
    s->>'type',
    COALESCE((s->>'is_visible')::boolean, true),
    COALESCE((s->>'sort_order')::int, 0),
    COALESCE((s->>'settings')::jsonb, '{}'::jsonb),
    COALESCE((s->>'content')::jsonb, '{}'::jsonb),
    p_event_id,
    (SELECT created_by FROM public.events WHERE id = p_event_id)
  FROM public.cms_pages p
  CROSS JOIN LATERAL jsonb_array_elements(
    (SELECT cms_sections FROM public.event_templates WHERE id = p_template_id)
  ) AS s
  WHERE p.event_id = p_event_id AND p.slug = 'home';
END;
$$;

-- 12. REFRESH FINANCIAL AGGREGATES FUNCTION
CREATE OR REPLACE FUNCTION public.refresh_financial_aggregates()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.financial_aggregates;
END;
$$;

-- 13. TRIGGER FOR FINANCIAL AGGREGATES REFRESH
CREATE OR REPLACE FUNCTION public.trigger_refresh_financial_aggregates()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Refresh asynchronously via pg_notify
  PERFORM pg_notify('refresh_financial_aggregates', '');
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_financial_aggregates ON public.transactions;
CREATE TRIGGER trg_refresh_financial_aggregates
AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.trigger_refresh_financial_aggregates();

-- 14. LISTENER FOR FINANCIAL AGGREGATES (run via pg_cron or external worker)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('refresh-financial-aggregates', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.financial_aggregates;');

-- 15. HELPER: Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_roles WHERE user_id = uid AND role = 'SUPER_ADMIN');
$$;

-- 16. HELPER: Check if user is event admin
CREATE OR REPLACE FUNCTION public.is_event_admin(eid UUID, uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin(uid) OR EXISTS (
    SELECT 1 FROM public.event_members 
    WHERE event_id = eid AND user_id = uid AND role = 'ADMIN' AND status = 'active'
  );
$$;

-- 17. HELPER: Apply template to event (callable from API)
CREATE OR REPLACE FUNCTION public.api_apply_template(p_event_id UUID, p_template_id UUID, p_overrides JSONB DEFAULT '{}')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_result JSONB;
BEGIN
  PERFORM public.apply_template_to_event(p_event_id, p_template_id, p_overrides);
  v_result := jsonb_build_object('success', true, 'message', 'Template applied successfully');
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
-- 18. SEED template bawaan (idempoten)
INSERT INTO public.event_templates (name, description, category, theme_tokens, layout_variant, hero_variant, component_registry, cms_sections, default_settings, branding_assets, is_active, is_premium)
SELECT 'Paskibra Klasik', 'Tampilan bawaan LKBB: gelap, tegas, aksen lime.', 'paskibra',
  '{"colors":{"primary":"#D9FF3F","background":"#0A0A09","surface":"#141412","text":"#F2F0E9","muted":"#92918C","border":"#292927"},"fonts":{"display":"Instrument Sans","body":"Geist","mono":"JetBrains Mono"},"radii":{"sm":"4px","md":"8px","lg":"16px","full":"9999px"}}'::jsonb,
  'default', 'split', '{}'::jsonb, '[]'::jsonb,
  '{"online_price":3000,"offline_price":5000,"ballot_presets":[10,50,100,300],"voting_enabled":true,"show_leaderboard":true}'::jsonb,
  '{}'::jsonb, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.event_templates WHERE name = 'Paskibra Klasik');

INSERT INTO public.event_templates (name, description, category, theme_tokens, layout_variant, hero_variant, component_registry, cms_sections, default_settings, branding_assets, is_active, is_premium)
SELECT 'Modern Minimal', 'Bersih dan terang, fokus ke konten.', 'generic',
  '{"colors":{"primary":"#2563EB","background":"#FFFFFF","surface":"#F4F4F5","text":"#18181B","muted":"#71717A","border":"#E4E4E7"},"fonts":{"display":"Inter","body":"Inter","mono":"JetBrains Mono"},"radii":{"sm":"6px","md":"10px","lg":"18px","full":"9999px"}}'::jsonb,
  'modern', 'centered', '{}'::jsonb, '[]'::jsonb,
  '{"online_price":3000,"offline_price":5000,"ballot_presets":[10,50,100,300],"voting_enabled":true,"show_leaderboard":true}'::jsonb,
  '{}'::jsonb, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.event_templates WHERE name = 'Modern Minimal');
