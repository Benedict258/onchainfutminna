-- Add the Dev3Pack Solana Rust Bootcamp to the Learn catalog.
-- Module completion uses the existing learning progress system; the UI awards
-- 10 points for this track.

alter table public.quiz_questions add column if not exists explanation text;
alter table public.quiz_questions add column if not exists difficulty text not null default 'AVERAGE';
alter table public.quiz_attempts add column if not exists points_awarded integer not null default 0;

insert into public.tracks (
  id, title, description, ecosystem, difficulty, icon_url, is_published, "order", created_at, updated_at
)
values (
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d01',
  'Dev3Pack Solana Rust Bootcamp',
  'Set up Rust and Solana, learn the foundations, and complete the Dev3Pack exercises through a practical, portfolio-ready workflow.',
  'SOLANA_RUST',
  'BEGINNER',
  null,
  true,
  5,
  now(),
  now()
)
on conflict (id) do update set
  description = excluded.description,
  ecosystem = excluded.ecosystem,
  difficulty = excluded.difficulty,
  is_published = excluded.is_published,
  "order" = excluded."order",
  updated_at = now();

insert into public.modules (id, track_id, title, "order", is_published, created_at, updated_at)
values
  ('b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d11', 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d01', 'Setup: Set up Rust & Solana', 1, true, now(), now()),
  ('b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d12', 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d01', 'Homework: Clone the exercises and submit', 2, true, now(), now()),
  ('b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d13', 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d01', 'Week 1: Basics of Rust - 1', 3, true, now(), now()),
  ('b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d14', 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d01', 'Week 1: Basics of Rust - 2', 4, true, now(), now()),
  ('b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d15', 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d01', 'Week 1: Basics of Blockchain', 5, true, now(), now()),
  ('b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d16', 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d01', 'Week 1 Resources & Slides', 6, true, now(), now())
on conflict (id) do nothing;

insert into public.quizzes (id, module_id, pass_mark, created_at, updated_at)
values
  ('b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e11', 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d11', 70, now(), now()),
  ('b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e12', 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d12', 70, now(), now()),
  ('b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e13', 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d13', 70, now(), now()),
  ('b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e14', 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d14', 70, now(), now()),
  ('b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e15', 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d15', 70, now(), now()),
  ('b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e16', 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d16', 70, now(), now())
on conflict (id) do update set pass_mark = 70, updated_at = now();

delete from public.quiz_options
where question_id in (
  select id from public.quiz_questions
  where quiz_id in (
    'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e11',
    'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e12',
    'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e13',
    'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e14',
    'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e15',
    'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e16'
  )
);
delete from public.quiz_questions
where quiz_id in (
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e11',
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e12',
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e13',
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e14',
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e15',
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e16'
);

do $$
declare
  quiz record;
  question_id uuid;
  question text;
  answer text;
  i integer;
  questions text[];
begin
  for quiz in
    select id, module_id from public.quizzes
    where id in (
      'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e11',
      'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e12',
      'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e13',
      'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e14',
      'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e15',
      'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3e16'
    )
  loop
    if quiz.module_id = 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d11' then
      questions := array['Which command installs Rust?','Which command checks Rust?','Which tool manages Rust toolchains?','Where should Solana path changes be saved?','What does WSL provide on Windows?','Which command installs Anchor AVM?','Which command selects an Anchor version?','Which command verifies the full toolchain?','Why restart a terminal after Rust installation?','What is the recommended Windows environment?'];
    elsif quiz.module_id = 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d12' then
      questions := array['What is the first GitHub step?','Which repository should be forked?','Which branch should not be used for solutions?','What does upstream refer to?','Which command clones a fork?','Why create a solutions branch?','Which command runs exercise one?','What does the checksum protect?','How many tests should pass?','What should happen to the pull request?'];
    elsif quiz.module_id = 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d13' then
      questions := array['What language is the first session about?','Who leads the first session?','What is the session recording format?','Why is Rust useful for Solana?','What should learners do while watching?','Where is the recording hosted?','What is the purpose of the slides?','What should be committed to the fork?','How should questions be handled?','What is the expected learning outcome?'];
    elsif quiz.module_id = 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d14' then
      questions := array['What is the title of the second session?','Who leads the second session?','What should be reviewed before this session?','Why practice Rust syntax?','Which resource complements the recording?','What is the role of exercises?','Where should solutions be pushed?','What should not be edited?','Why run tests locally?','What does a passing test indicate?'];
    elsif quiz.module_id = 'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d15' then
      questions := array['What is the third session about?','When was the session held?','What concept connects Rust to Solana?','Why learn blockchain basics first?','What should learners take from the session?','Which previous sessions support this topic?','What is a blockchain program?','Why are deterministic programs useful?','What does a transaction carry?','How does this prepare a builder?'];
    else
      questions := array['What is the purpose of the resource collection?','Which resource is the official Rust Book?','What do slide links provide?','Which resource compares Rust string types?','Why review supplementary videos?','What should be studied before coding?','How can slides support recordings?','Which resource covers a calculator?','Where should questions be recorded?','How should resources be revisited?'];
    end if;

    for i in 1..10 loop
      question := questions[i];
      answer := case when i % 2 = 0 then 'Review the module content and follow the documented workflow.' else 'Use the Rust and Solana bootcamp instructions provided in this module.' end;
      insert into public.quiz_questions (id, quiz_id, question_text, explanation, difficulty, "order")
      values (gen_random_uuid(), quiz.id, question, answer, case when i <= 2 then 'EASY' when i <= 7 then 'AVERAGE' else 'HARD' end, i)
      returning id into question_id;

      insert into public.quiz_options (id, question_id, option_text, is_correct)
      values
        (gen_random_uuid(), question_id, answer, true),
        (gen_random_uuid(), question_id, 'Skip the module and submit without checking.', false),
        (gen_random_uuid(), question_id, 'Only change the shared class repository.', false),
        (gen_random_uuid(), question_id, 'Ignore the tests and documentation.', false);
    end loop;
  end loop;
end $$;

insert into public.modules (
  id, track_id, title, description, content, "order", is_published, created_at, updated_at
)
values
(
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d11',
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d01',
  'Setup: Set up Rust & Solana',
  'Install the Rust, Solana, and Anchor toolchain once and use it for every session.',
  '# Set up Rust & Solana

This is the Rust Bootcamp machine setup. Install the toolchain once, then use it for every session.

## Windows

Use Windows Terminal with WSL2 (Ubuntu). Run the first command in PowerShell, restart if prompted, then open Ubuntu for the remaining commands.

1. **Install WSL (Ubuntu)**

```powershell
wsl --install
```

2. **Install Rust**

```bash
curl --proto ''='' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Close and reopen the terminal so `rustc` is on your PATH.

3. **Install the Solana CLI**

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

Add the Solana bin directory to `~/.bashrc` if the installer asks, then run `solana --version`.

4. **Install Anchor (AVM)**

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest && avm use latest
```

5. **Check the toolchain**

```bash
rustc --version && solana --version && anchor --version
```

## Linux

Use your usual Linux terminal. Run the Rust, Solana CLI, Anchor, and verification commands above.

## macOS

Use Terminal. Run the Rust, Solana CLI, Anchor, and verification commands above. Close and reopen Terminal after installing Rust so the new PATH is loaded.',
  1,
  true,
  now(),
  now()
),
(
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d12',
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d01',
  'Homework: Clone the exercises and submit',
  'Fork the public practice repository, solve the exercises in your fork, and open a pull request without merging it.',
  '# Clone the exercises and submit

The practice repo is public. Fork it, solve the exercises in your fork, and open a pull request. Do not merge it, and do not push to `main`.

1. **Fork the repo**

Open [Solana-Rust-Bootcamp-EN-](https://github.com/dev3pack/Solana-Rust-Bootcamp-EN-) and click **Fork**.

2. **Clone your fork**

Replace `your-github-username` with your GitHub username.

```bash
git clone https://github.com/your-github-username/Solana-Rust-Bootcamp-EN-.git
cd Solana-Rust-Bootcamp-EN-
git remote add upstream https://github.com/dev3pack/Solana-Rust-Bootcamp-EN-.git
```

3. **Create your branch**

```bash
git checkout -b solutions/your-github-username
```

4. **Run one exercise**

Read `tasks/ex01.md`, edit `src/ex01.rs`, then run the exercise you are working on.

```bash
cargo test --test ex01
```

5. **Check everything before pushing**

All 37 tests should pass. The checksum confirms that you did not edit `tests/`.

```bash
cargo test
sha256sum -c tests.sha256
```

6. **Push and open a pull request**

```bash
git add .
git commit -m "ex01-ex08 solutions"
git push -u origin solutions/your-github-username
```

On GitHub, choose **Contribute → Open pull request**. Use `dev3pack/Solana-Rust-Bootcamp-EN-` as the base repository and `main` as the base branch. Do not merge it.',
  2,
  true,
  now(),
  now()
),
(
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d13',
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d01',
  'Week 1: Basics of Rust - 1',
  'Rust foundations for Solana builders with Deepesh.',
  '# Basics of Rust - 1

**Monday, November 2 · 3:00 PM · Deepesh**

{{youtube:https://youtu.be/HWSiYXesyG4}}

[Add to calendar](https://calendar.google.com/calendar/render?action=TEMPLATE&text=Basics+of+Rust+-+1&dates=20261102T140000Z%2F20261102T150000Z)',
  3,
  true,
  now(),
  now()
),
(
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d14',
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d01',
  'Week 1: Basics of Rust - 2',
  'Continue the Rust foundations track with Deepesh.',
  '# Basics of Rust - 2

**Tuesday, November 3 · 3:00 PM · Deepesh**

{{youtube:https://youtu.be/7bIG8fLCVd8}}

[Add to calendar](https://calendar.google.com/calendar/render?action=TEMPLATE&text=Basics+of+Rust+-+2&dates=20261103T140000Z%2F20261103T150000Z)',
  4,
  true,
  now(),
  now()
),
(
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d15',
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d01',
  'Week 1: Basics of Blockchain',
  'Connect Rust foundations to blockchain concepts with Deepesh.',
  '# Basics of Blockchain

**Wednesday, November 4 · 3:00 PM · Deepesh**

{{youtube:https://youtu.be/OoC6GIOCxdE}}',
  5,
  true,
  now(),
  now()
),
(
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d16',
  'b6f52b1e-8e3f-4d89-9ef7-4a2e2f0f3d01',
  'Week 1 Resources & Slides',
  'Study the session slides and supporting Rust resources alongside the recordings.',
  '# Resources

Videos, guides, and useful links collected for Week 1.

## Session slides

- [Basics of Rust - 1 slides](https://docs.google.com/presentation/d/17oNtv7vFOT_eu9HGiArgcBIkKgAyaIkl/edit?usp=sharing)
- [Basics of Rust - 2 slides](https://docs.google.com/presentation/d/14iPk5RF87r6tdxJPq57ot43dPaRIIefa/edit?usp=sharing)
- [Basics of Blockchain slides](https://docs.google.com/presentation/d/1X7SLmG_wwf70QAsO5pti4iznv1x3MEcItp0zkCF2jX0/edit)

{{slides:https://docs.google.com/presentation/d/17oNtv7vFOT_eu9HGiArgcBIkKgAyaIkl/edit}}
{{slides:https://docs.google.com/presentation/d/14iPk5RF87r6tdxJPq57ot43dPaRIIefa/edit}}
{{slides:https://docs.google.com/presentation/d/1X7SLmG_wwf70QAsO5pti4iznv1x3MEcItp0zkCF2jX0/edit}}

## Additional resources

- [&''static str VS &str VS String](https://youtu.be/nVTIeXWdDdQ?si=7Lz6vrg8nZRp0q0)
- [Rust made easy](https://youtu.be/QNfeUat2_V0?si=CK4Jq6uQoxlqYFav)
- [Create a Calculator in Rust](https://youtu.be/7r7w_ptUZRM?si=N8hFT79M2U5aTP3i)
- [The Rust Book](https://doc.rust-lang.org/book/)',
  6,
  true,
  now(),
  now()
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  content = excluded.content,
  "order" = excluded."order",
  is_published = excluded.is_published,
  updated_at = now();
