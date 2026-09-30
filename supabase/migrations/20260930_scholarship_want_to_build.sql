-- New form question: "Something you would like to build".
-- Nullable so rows submitted before this question existed stay valid.

alter table public.rust_scholarship_applications
  add column if not exists want_to_build text check (char_length(want_to_build) <= 500);
