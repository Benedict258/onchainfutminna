-- Applied 2026-09-30. Currently unused: "what you would like to build" was merged into
-- goal_by_end_nov ("What do you want to build?"). Nullable, so it is safe to leave or drop.

alter table public.rust_scholarship_applications
  add column if not exists want_to_build text check (char_length(want_to_build) <= 500);
