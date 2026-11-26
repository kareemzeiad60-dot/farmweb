# Fieldwise

A farm workspace for crops, apiary, livestock, finance and farm management. It is a static web app
(plain HTML/CSS/JS + Tailwind) that stores data in the browser, or in Supabase when signed in.

## Project layout

```
index.html                 entry page (loads the scripts below in order)
src/
  config/                  supabase-config.js, modules.js (nav groups), regions.js
  data/
    db-schema.js           table layout for every resource (single source of truth for the SQL)
    resources/             list columns + form fields, one file per module
  state/                   defaults.js (profile/region defaults), state.js (DOM refs + shared state)
  services/                records-db.js (record <-> table row mapping), store.js, auth.js, farms.js,
                           weather.js, holidays.js, location.js, supabase.js
  ui/                      navigation, dashboard, list, form, help, farm-profile, render, chrome
  actions/records.js       save / delete / import / export
  utils/helpers.js
  main.js                  event wiring and app start
styles/                    app.css, tailwind.input.css, tailwind.css (generated)
supabase/migrations/       001_core.sql, 002_domain_tables.sql, 003_migrate_legacy_records.sql
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

Needs PostgreSQL 15+ (current Supabase projects). Every table has `farm_id`; links between tables use
composite foreign keys `(farm_id, id)`, so a record can never point into another farm. Owners,
managers and workers can edit; viewers are read-only. Values the app has no column for are kept in the
`extra` jsonb column.

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

## Security notes

- `src/config/supabase-config.js` holds the project URL and the public (publishable) key. That key is
  meant for browsers; access is controlled by Row Level Security. Never put a `service_role` key or a
  GitHub token in this repo.
