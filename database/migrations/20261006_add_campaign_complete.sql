-- Codexus Newsletter
-- Add campaign completion tracking to newsletter issues.
-- Applied manually to CODEXUS NEWSLETTER DEV during multi-tenant E2E testing.

alter table public.issues
add column if not exists campaign_complete boolean not null default false;
