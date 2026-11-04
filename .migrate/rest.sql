-- Trigger

CREATE TRIGGER app_new_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION app_new_user();
CREATE TRIGGER touch BEFORE INSERT OR UPDATE ON public.kpi_daily FOR EACH ROW EXECUTE FUNCTION app_touch();
CREATE TRIGGER touch BEFORE INSERT OR UPDATE ON public.kpi_targets FOR EACH ROW EXECUTE FUNCTION app_touch();
CREATE TRIGGER touch BEFORE INSERT OR UPDATE ON public.location_settings FOR EACH ROW EXECUTE FUNCTION app_touch();
CREATE TRIGGER touch BEFORE INSERT OR UPDATE ON public.problem_cases FOR EACH ROW EXECUTE FUNCTION app_touch();
CREATE TRIGGER touch BEFORE INSERT OR UPDATE ON public.pdca_cycles FOR EACH ROW EXECUTE FUNCTION app_touch();
CREATE TRIGGER touch BEFORE INSERT OR UPDATE ON public.pdca_actions FOR EACH ROW EXECUTE FUNCTION app_touch();
CREATE TRIGGER touch BEFORE INSERT OR UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION app_touch();
CREATE TRIGGER cal_touch BEFORE UPDATE ON public.cal_events FOR EACH ROW EXECUTE FUNCTION cal_touch();
CREATE TRIGGER cal_notify AFTER INSERT OR UPDATE ON public.cal_events FOR EACH ROW EXECUTE FUNCTION cal_notify();
CREATE TRIGGER cal_notify_del BEFORE DELETE ON public.cal_events FOR EACH ROW EXECUTE FUNCTION cal_notify();
CREATE TRIGGER cal_rsvp_notify AFTER INSERT OR UPDATE ON public.cal_responses FOR EACH ROW EXECUTE FUNCTION cal_rsvp_notify();
CREATE TRIGGER ss_projects_touch BEFORE UPDATE ON public.ss_projects FOR EACH ROW EXECUTE FUNCTION app_touch();
CREATE TRIGGER ss_sheets_touch BEFORE UPDATE ON public.ss_sheets FOR EACH ROW EXECUTE FUNCTION app_touch();
CREATE TRIGGER ss_analyses_touch BEFORE UPDATE ON public.ss_analyses FOR EACH ROW EXECUTE FUNCTION app_touch();
CREATE TRIGGER ss_files_touch BEFORE UPDATE ON public.ss_files FOR EACH ROW EXECUTE FUNCTION app_touch();
CREATE TRIGGER lean_items_touch BEFORE UPDATE ON public.lean_items FOR EACH ROW EXECUTE FUNCTION lean_items_touch();

-- RLS

alter table public.lean_items enable row level security;
alter table public.problem_cases_backup enable row level security;
alter table public.gemba_items enable row level security;
alter table public.quali_matrix enable row level security;
alter table public.pm_projects enable row level security;
alter table public.kpi_records enable row level security;
alter table public.locations enable row level security;
alter table public.contacts enable row level security;
alter table public.app_members enable row level security;
alter table public.submissions enable row level security;
alter table public.scorecards enable row level security;
alter table public.profiles enable row level security;
alter table public.profiles_private enable row level security;
alter table public.meetings enable row level security;
alter table public.chat_messages enable row level security;
alter table public.kpi_daily enable row level security;
alter table public.location_settings enable row level security;
alter table public.problem_cases enable row level security;
alter table public.pdca_cycles enable row level security;
alter table public.chat_reads enable row level security;
alter table public.notifications enable row level security;
alter table public.kpi_targets enable row level security;
alter table public.pdca_actions enable row level security;
alter table public.cal_events enable row level security;
alter table public.cal_responses enable row level security;
alter table public.cal_prefs enable row level security;
alter table public.ss_projects enable row level security;
alter table public.ss_sheets enable row level security;
alter table public.ss_analyses enable row level security;
alter table public.ss_files enable row level security;
alter table public.mail_config enable row level security;
alter table public.mail_settings enable row level security;
alter table public.mail_log enable row level security;
alter table public.mail_runs enable row level security;

create policy loc_admin on public.locations as PERMISSIVE for ALL to authenticated using (app_is_admin()) with check (app_is_admin());
create policy profiles_read on public.profiles as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM app_members m
  WHERE (m.user_id = auth.uid()))));
create policy profiles_ins on public.profiles as PERMISSIVE for INSERT to public with check (((user_id = auth.uid()) OR app_is_admin()));
create policy profiles_upd on public.profiles as PERMISSIVE for UPDATE to public using (((user_id = auth.uid()) OR app_is_admin())) with check (((user_id = auth.uid()) OR app_is_admin()));
create policy profiles_private_own on public.profiles_private as PERMISSIVE for ALL to public using (((user_id = auth.uid()) OR app_is_admin())) with check (((user_id = auth.uid()) OR app_is_admin()));
create policy notif_read on public.notifications as PERMISSIVE for SELECT to public using ((user_id = auth.uid()));
create policy notif_upd on public.notifications as PERMISSIVE for UPDATE to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy notif_del on public.notifications as PERMISSIVE for DELETE to public using ((user_id = auth.uid()));
create policy mem_read on public.app_members as PERMISSIVE for SELECT to authenticated using (((user_id = auth.uid()) OR app_is_admin()));
create policy mem_admin on public.app_members as PERMISSIVE for ALL to authenticated using (app_is_admin()) with check (app_is_admin());
create policy kpi_targets_del on public.kpi_targets as PERMISSIVE for DELETE to authenticated using (app_can(location, true));
create policy location_settings_read on public.location_settings as PERMISSIVE for SELECT to authenticated using (app_can(location));
create policy location_settings_ins on public.location_settings as PERMISSIVE for INSERT to authenticated with check (app_can(location, true));
create policy location_settings_upd on public.location_settings as PERMISSIVE for UPDATE to authenticated using (app_can(location, true)) with check (app_can(location, true));
create policy location_settings_del on public.location_settings as PERMISSIVE for DELETE to authenticated using (app_can(location, true));
create policy problem_cases_read on public.problem_cases as PERMISSIVE for SELECT to authenticated using (app_can(location));
create policy problem_cases_ins on public.problem_cases as PERMISSIVE for INSERT to authenticated with check (app_can(location, true));
create policy problem_cases_upd on public.problem_cases as PERMISSIVE for UPDATE to authenticated using (app_can(location, true)) with check (app_can(location, true));
create policy problem_cases_del on public.problem_cases as PERMISSIVE for DELETE to authenticated using (app_can(location, true));
create policy pdca_cycles_read on public.pdca_cycles as PERMISSIVE for SELECT to authenticated using (app_can(location));
create policy pdca_cycles_ins on public.pdca_cycles as PERMISSIVE for INSERT to authenticated with check (app_can(location, true));
create policy chat_ins on public.chat_messages as PERMISSIVE for INSERT to public with check (((sender = auth.uid()) AND app_chat_ok(room)));
create policy notif_ins on public.notifications as PERMISSIVE for INSERT to public with check (((created_by = auth.uid()) AND app_can(location, true) AND (EXISTS ( SELECT 1
   FROM app_members m
  WHERE (m.user_id = notifications.user_id)))));
create policy contacts_read on public.contacts as PERMISSIVE for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM app_members
  WHERE (app_members.user_id = auth.uid()))));
create policy contacts_admin on public.contacts as PERMISSIVE for ALL to authenticated using (app_is_admin()) with check (app_is_admin());
create policy kpi_daily_read on public.kpi_daily as PERMISSIVE for SELECT to authenticated using (app_can(location));
create policy kpi_daily_ins on public.kpi_daily as PERMISSIVE for INSERT to authenticated with check (app_can(location, true));
create policy kpi_daily_upd on public.kpi_daily as PERMISSIVE for UPDATE to authenticated using (app_can(location, true)) with check (app_can(location, true));
create policy kpi_daily_del on public.kpi_daily as PERMISSIVE for DELETE to authenticated using (app_can(location, true));
create policy kpi_targets_read on public.kpi_targets as PERMISSIVE for SELECT to authenticated using (app_can(location));
create policy kpi_targets_ins on public.kpi_targets as PERMISSIVE for INSERT to authenticated with check (app_can(location, true));
create policy kpi_targets_upd on public.kpi_targets as PERMISSIVE for UPDATE to authenticated using (app_can(location, true)) with check (app_can(location, true));
create policy loc_read on public.locations as PERMISSIVE for SELECT to authenticated using (app_can(code));
create policy mail_settings_read on public.mail_settings as PERMISSIVE for SELECT to public using (app_can(location));
create policy mail_settings_admin on public.mail_settings as PERMISSIVE for ALL to public using (app_is_admin()) with check (app_is_admin());
create policy mail_log_admin on public.mail_log as PERMISSIVE for SELECT to public using (app_is_admin());
create policy scorecards_read on public.scorecards as PERMISSIVE for SELECT to public using (app_can(location));
create policy scorecards_admin on public.scorecards as PERMISSIVE for ALL to public using (app_is_admin()) with check (app_is_admin());
create policy ss_projects_read on public.ss_projects as PERMISSIVE for SELECT to authenticated using (app_studio(location));
create policy ss_projects_ins on public.ss_projects as PERMISSIVE for INSERT to authenticated with check (app_studio(location, true));
create policy ss_projects_upd on public.ss_projects as PERMISSIVE for UPDATE to authenticated using (app_studio(location, true)) with check (app_studio(location, true));
create policy ss_projects_del on public.ss_projects as PERMISSIVE for DELETE to authenticated using (app_studio(location, true));
create policy ss_sheets_read on public.ss_sheets as PERMISSIVE for SELECT to authenticated using (ss_can(project_id));
create policy ss_sheets_write on public.ss_sheets as PERMISSIVE for ALL to authenticated using (ss_can(project_id, true)) with check (ss_can(project_id, true));
create policy ss_analyses_read on public.ss_analyses as PERMISSIVE for SELECT to authenticated using (ss_can(project_id));
create policy ss_files_read on public.ss_files as PERMISSIVE for SELECT to authenticated using (ss_can(project_id));
create policy pdca_cycles_upd on public.pdca_cycles as PERMISSIVE for UPDATE to authenticated using (app_can(location, true)) with check (app_can(location, true));
create policy pdca_cycles_del on public.pdca_cycles as PERMISSIVE for DELETE to authenticated using (app_can(location, true));
create policy pdca_actions_read on public.pdca_actions as PERMISSIVE for SELECT to authenticated using (app_can(location));
create policy pdca_actions_ins on public.pdca_actions as PERMISSIVE for INSERT to authenticated with check (app_can(location, true));
create policy pdca_actions_upd on public.pdca_actions as PERMISSIVE for UPDATE to authenticated using (app_can(location, true)) with check (app_can(location, true));
create policy pdca_actions_del on public.pdca_actions as PERMISSIVE for DELETE to authenticated using (app_can(location, true));
create policy meetings_read on public.meetings as PERMISSIVE for SELECT to authenticated using (app_can(location));
create policy meetings_ins on public.meetings as PERMISSIVE for INSERT to authenticated with check (app_can(location, true));
create policy meetings_upd on public.meetings as PERMISSIVE for UPDATE to authenticated using (app_can(location, true)) with check (app_can(location, true));
create policy meetings_del on public.meetings as PERMISSIVE for DELETE to authenticated using (app_can(location, true));
create policy sub_read on public.submissions as PERMISSIVE for SELECT to authenticated using (app_can(location));
create policy chat_read on public.chat_messages as PERMISSIVE for SELECT to public using (app_chat_ok(room));
create policy mail_config_admin on public.mail_config as PERMISSIVE for ALL to public using (app_is_admin()) with check (app_is_admin());
create policy sub_ins on public.submissions as PERMISSIVE for INSERT to authenticated with check ((app_can(location, true) AND (user_id = auth.uid())));
create policy chat_del on public.chat_messages as PERMISSIVE for DELETE to public using ((sender = auth.uid()));
create policy chat_reads_own on public.chat_reads as PERMISSIVE for ALL to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy cal_upd on public.cal_events as PERMISSIVE for UPDATE to public using (((organizer = auth.uid()) OR app_is_admin())) with check (app_can(location));
create policy cal_del on public.cal_events as PERMISSIVE for DELETE to public using (((organizer = auth.uid()) OR app_is_admin()));
create policy cal_resp_sel on public.cal_responses as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM cal_events e
  WHERE (e.id = cal_responses.event_id))));
create policy cal_resp_own on public.cal_responses as PERMISSIVE for ALL to public using ((user_id = auth.uid())) with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM cal_events e
  WHERE ((e.id = cal_responses.event_id) AND (auth.uid() = ANY (e.attendees)))))));
create policy cal_prefs_sel on public.cal_prefs as PERMISSIVE for SELECT to authenticated using (true);
create policy cal_prefs_own on public.cal_prefs as PERMISSIVE for ALL to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy cal_sel on public.cal_events as PERMISSIVE for SELECT to public using ((app_can(location) AND ((NOT private) OR (organizer = auth.uid()) OR (auth.uid() = ANY (attendees)))));
create policy cal_ins on public.cal_events as PERMISSIVE for INSERT to public with check (((organizer = auth.uid()) AND app_can(location)));
create policy ss_analyses_write on public.ss_analyses as PERMISSIVE for ALL to authenticated using (ss_can(project_id, true)) with check (ss_can(project_id, true));
create policy ss_files_write on public.ss_files as PERMISSIVE for ALL to authenticated using (ss_can(project_id, true)) with check (ss_can(project_id, true));
create policy lean_items_read on public.lean_items as PERMISSIVE for SELECT to public using (app_can(location));
create policy lean_items_ins on public.lean_items as PERMISSIVE for INSERT to public with check (app_can(location, true));
create policy lean_items_upd on public.lean_items as PERMISSIVE for UPDATE to public using (app_can(location, true)) with check (app_can(location, true));
create policy lean_items_del on public.lean_items as PERMISSIVE for DELETE to public using (app_can(location, true));
create policy gemba_items_read on public.gemba_items as PERMISSIVE for SELECT to public using (app_can(location));
create policy gemba_items_ins on public.gemba_items as PERMISSIVE for INSERT to public with check ((app_can(location) AND ((kind <> 'station'::text) OR app_can(location, true))));
create policy gemba_items_upd on public.gemba_items as PERMISSIVE for UPDATE to public using (app_can(location, true)) with check (app_can(location, true));
create policy gemba_items_del on public.gemba_items as PERMISSIVE for DELETE to public using (app_can(location, true));
create policy quali_matrix_read on public.quali_matrix as PERMISSIVE for SELECT to public using (app_can(location));
create policy quali_matrix_ins on public.quali_matrix as PERMISSIVE for INSERT to public with check (app_can(location, true));
create policy quali_matrix_upd on public.quali_matrix as PERMISSIVE for UPDATE to public using (app_can(location, true)) with check (app_can(location, true));
create policy quali_matrix_del on public.quali_matrix as PERMISSIVE for DELETE to public using (app_can(location, true));
create policy pm_projects_read on public.pm_projects as PERMISSIVE for SELECT to public using (app_can(location));
create policy pm_projects_ins on public.pm_projects as PERMISSIVE for INSERT to public with check (app_can(location, true));
create policy pm_projects_upd on public.pm_projects as PERMISSIVE for UPDATE to public using (app_can(location, true)) with check (app_can(location, true));
create policy pm_projects_del on public.pm_projects as PERMISSIVE for DELETE to public using (app_can(location, true));

insert into storage.buckets (id,name,public) values ('chat-files','chat-files',false) on conflict do nothing;

create policy chat_files_read on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'chat-files'::text) AND app_chat_ok(replace(split_part(name, '/'::text, 1), '_'::text, ':'::text))));
create policy chat_files_ins on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'chat-files'::text) AND app_chat_ok(replace(split_part(name, '/'::text, 1), '_'::text, ':'::text))));
create policy chat_files_upd on storage.objects as PERMISSIVE for UPDATE to authenticated using (((bucket_id = 'chat-files'::text) AND (owner_id = (auth.uid())::text))) with check (((bucket_id = 'chat-files'::text) AND app_chat_ok(replace(split_part(name, '/'::text, 1), '_'::text, ':'::text))));

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.cal_events;
alter publication supabase_realtime add table public.cal_responses;
alter publication supabase_realtime add table public.gemba_items;

select cron.schedule('kpi-mail','*/5 * * * *','select public.kpi_mail_tick()');
