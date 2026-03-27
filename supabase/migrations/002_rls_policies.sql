-- Organisations: users can only see their own org
alter table organisations enable row level security;
create policy "org_select" on organisations for select
  using (id in (select organisation_id from user_profiles where id = auth.uid()));
create policy "org_insert" on organisations for insert
  with check (true);

-- User profiles
alter table user_profiles enable row level security;
create policy "profile_select" on user_profiles for select
  using (id = auth.uid());
create policy "profile_insert" on user_profiles for insert
  with check (id = auth.uid());

-- Sites: scoped to org
alter table sites enable row level security;
create policy "sites_select" on sites for select
  using (organisation_id in (select organisation_id from user_profiles where id = auth.uid()));
create policy "sites_insert" on sites for insert
  with check (organisation_id in (select organisation_id from user_profiles where id = auth.uid()));
create policy "sites_update" on sites for update
  using (organisation_id in (select organisation_id from user_profiles where id = auth.uid()));

-- Intake responses: scoped via site → org
alter table intake_responses enable row level security;
create policy "intake_select" on intake_responses for select
  using (site_id in (select id from sites where organisation_id in (
    select organisation_id from user_profiles where id = auth.uid())));
create policy "intake_insert" on intake_responses for insert
  with check (site_id in (select id from sites where organisation_id in (
    select organisation_id from user_profiles where id = auth.uid())));
create policy "intake_update" on intake_responses for update
  using (site_id in (select id from sites where organisation_id in (
    select organisation_id from user_profiles where id = auth.uid())));

-- Conversation turns: scoped via site → org
alter table conversation_turns enable row level security;
create policy "turns_select" on conversation_turns for select
  using (site_id in (select id from sites where organisation_id in (
    select organisation_id from user_profiles where id = auth.uid())));
create policy "turns_insert" on conversation_turns for insert
  with check (site_id in (select id from sites where organisation_id in (
    select organisation_id from user_profiles where id = auth.uid())));

-- Analysis jobs: scoped via site → org
alter table analysis_jobs enable row level security;
create policy "jobs_select" on analysis_jobs for select
  using (site_id in (select id from sites where organisation_id in (
    select organisation_id from user_profiles where id = auth.uid())));
create policy "jobs_insert" on analysis_jobs for insert
  with check (site_id in (select id from sites where organisation_id in (
    select organisation_id from user_profiles where id = auth.uid())));
create policy "jobs_update" on analysis_jobs for update
  using (site_id in (select id from sites where organisation_id in (
    select organisation_id from user_profiles where id = auth.uid())));

-- Gap findings: scoped via site → org
alter table gap_findings enable row level security;
create policy "findings_select" on gap_findings for select
  using (site_id in (select id from sites where organisation_id in (
    select organisation_id from user_profiles where id = auth.uid())));
create policy "findings_insert" on gap_findings for insert with check (true);

-- Finding notes: scoped via finding → site → org
alter table finding_notes enable row level security;
create policy "notes_select" on finding_notes for select
  using (finding_id in (select id from gap_findings where site_id in (
    select id from sites where organisation_id in (
      select organisation_id from user_profiles where id = auth.uid()))));
create policy "notes_insert" on finding_notes for insert
  with check (created_by = auth.uid());

-- Readiness scores: scoped via site → org
alter table readiness_scores enable row level security;
create policy "scores_select" on readiness_scores for select
  using (site_id in (select id from sites where organisation_id in (
    select organisation_id from user_profiles where id = auth.uid())));
create policy "scores_insert" on readiness_scores for insert with check (true);

-- Quick check submissions: write-only from API, no user read access
alter table quick_check_submissions enable row level security;
create policy "quickcheck_insert" on quick_check_submissions for insert with check (true);
