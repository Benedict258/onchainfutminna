-- The application form was shortened (core team feedback): gender, hard learning,
-- internet quality and give-back plan are no longer asked. Existing answers are kept;
-- new rows leave these empty. Their check constraints still apply when a value is given.

alter table public.rust_scholarship_applications
  alter column gender drop not null,
  alter column hard_learning drop not null,
  alter column internet_quality drop not null,
  alter column giveback_plan drop not null;
