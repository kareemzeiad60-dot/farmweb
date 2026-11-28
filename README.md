# Fieldwise

A farm workspace for crops, apiary, livestock, equipment, finance and farm management. It is a static web app
(plain HTML/CSS/JS + Tailwind) that stores data in the browser, or in Supabase when signed in.

## Project layout

```
index.html                 entry page (loads the scripts below in order)
src/
  config/                  supabase-config.js, modules.js (nav groups), regions.js
  data/
    db-schema.js           table layout for every resource (single source of truth for the SQL)
    resources/             list columns + form fields, one file per module
  state/                   defaults.js (profile/region defaults), state.js (DOM refs + shared state),
                           permissions.js (what each role may do)
  services/                records-db.js (record <-> table row mapping), store.js, auth.js, farms.js,
                           team.js, weather.js, holidays.js, location.js, supabase.js
  ui/                      navigation, dashboard, list, form, help, farm-profile, team, my-tasks,
                           equipment (warranty / service logic), render, chrome
  actions/                 records.js (save / delete / import / export), team.js, tasks.js
  utils/helpers.js
  main.js                  event wiring and app start
styles/                    app.css, tailwind.input.css, tailwind.css (generated)
supabase/migrations/       001_core.sql, 002_domain_tables.sql, 003_migrate_legacy_records.sql,
                           004_team_invitations.sql, 005_equipment.sql
scripts/generate-sql.js    generates 002 and 003 from src/data/db-schema.js
samples/                   example workspace export (importable JSON)
tests/                     node:test unit tests
```

The files in `src/` are classic scripts that share one global scope, so **order matters**: when you
add a file, add its `<script>` tag to `index.html` in the right place (config, data, state, services,
ui, actions, main).

## Run locally

```
python3 -m http.server 8000     # or: npx serve
```

Open http://localhost:8000. Without Supabase the app works from browser storage.

## Database (Supabase)

Run the files in `supabase/migrations/` in order in the Supabase SQL editor:

1. `001_core.sql` – farms, members, profiles, the legacy `farm_records` table, helper functions, RLS.
2. `002_domain_tables.sql` – one real table per resource (`crop_fields`, `crops`, `bee_hives`,
   `animals`, `financial_records`, `tasks`, ...), with foreign keys, indexes and RLS.
3. `003_migrate_legacy_records.sql` – copies existing rows from `farm_records` into the new tables and
   prints a legacy-vs-new row count. It does not modify or drop `farm_records`; drop it yourself once
   the counts match and you have checked the app.

4. `004_team_invitations.sql` – invitations, member roles and linking workers to accounts (see below).

5. `005_equipment.sql` – the `equipment` and `equipment_services` tables (see below).

Needs PostgreSQL 15+ (current Supabase projects). Every table has `farm_id`; links between tables use
composite foreign keys `(farm_id, id)`, so a record can never point into another farm. Owners,
managers and workers can edit; viewers are read-only. Values the app has no column for are kept in the
`extra` jsonb column.

## Teams and roles

A farm can have several people. Roles (`farm_members.role`):

| Role    | Farm data | Team                                                       |
|---------|-----------|------------------------------------------------------------|
| owner   | edit      | invite managers / workers / viewers, change roles, remove  |
| manager | edit      | invite workers / viewers, remove workers / viewers         |
| worker  | edit      | – (sees "My tasks")                                        |
| viewer  | read-only | –                                                          |

Any non-owner can leave a farm. The rules are enforced in the database (RLS policies and the
functions in `004_team_invitations.sql`); the interface only hides what a role cannot do.

**Invitations.** On the Team page a manager enters an email and a role. No email is sent: the person
signs up or signs in with that address, confirms it, and the invitation appears at the top of the
app to accept or decline. Invitations expire after 14 days. Email confirmation must be on in Supabase
(Authentication → Providers → Email), otherwise nobody can accept an invitation, by design: an
unconfirmed address could be claimed by someone else.

**Workers.** `farm_workers.user_id` links a worker record to a login. Accepting an invitation links
an existing worker record with the same email, or creates one for the Worker role. Managers can
change the link on the Team page. Linked workers see their tasks under "My tasks".

## Equipment

Tractors, machinery, implements, vehicles and tools, with warranty and service tracking
(Equipment section in the sidebar; it can be switched off in Farm profile → modules).

- **Equipment** – make, model, serial number, purchase details, status, engine hours and warranty.
  The list shows a warranty badge (Active / Expires in N days within 60 days / Expired) and the
  next service (Due in N days within 30 days / Overdue).
- **Service Log** – one row per service: type, date, hours, cost, who did it and the next service
  due (by date and/or engine hours). Status *Scheduled* plans a future service. "Log service" on an
  equipment row opens the form with that machine selected.
- **Next service** = the earliest of the scheduled services and the "next due" date of the most
  recent completed service. It is overdue by date, or by hours once the equipment's engine hours
  reach the "next service at" reading. Retired equipment is not tracked.
- Equipment needing service shows under "Needs attention" in the list and on the dashboard card.
- Deleting equipment also deletes its service log.

Before `005_equipment.sql` is run the app keeps working and the Equipment pages stay empty; saving
shows which file to run.

### Changing the schema

Edit `src/data/db-schema.js` (and the resource definition in `src/data/resources/`), then:

```
npm run generate:sql
```

Write any change to an already-deployed database as a new numbered migration instead of editing 002.

## CSS

```
npm install
npm run build:css      # regenerates styles/tailwind.css (commit the result)
```

## Tests

```
npm test
```

Unit tests cover the record <-> row mapping; jsdom end-to-end tests run the real app against a fake
Supabase client (data loading and saving, roles, invitations, My tasks). The SQL itself was verified
on PostgreSQL (migrations 001-004, RLS and the team functions) but those checks are not part of
`npm test`.

## Security notes

- `src/config/supabase-config.js` holds the project URL and the public (publishable) key. That key is
  meant for browsers; access is controlled by Row Level Security. Never put a `service_role` key or a
  GitHub token in this repo.
