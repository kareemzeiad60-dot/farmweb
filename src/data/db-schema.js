// Single source of truth for the Postgres tables behind each Fieldwise resource.
// - The browser uses it to map app records <-> table rows (src/services/records-db.js).
// - scripts/generate-sql.js uses it to generate supabase/migrations/002 and 003.
//
// Column spec: { field, type, required?, ref?, noFk?, min?, default? }
//   field    camelCase key used by the app (column name is derived as snake_case)
//   type     text | numeric | int | date | bool | uuid
//   ref      resource id this column points to (column becomes <name>_id, a uuid foreign key)
//   noFk     keep the uuid column but skip the foreign key (circular references)
//   min      adds CHECK (col >= min) for numeric / int columns
//   member   uuid of a farm member (auth user); composite FK to farm_members, added by migration 004
//   readOnly loaded into records but never written by the app (set by database functions)
//   since    column was added by this migration number, so 002/003 are generated without it
//   onDelete "cascade" deletes the row when the referenced row is deleted (default: set the column null)
// Table spec: { table, columns, idType?, rangeCheck?, since? }
//   since    table is created by this migration number (not part of 002/003) and the app
//            tolerates it being missing until that migration has been run
// Every table also has: id, farm_id, created_by, extra (unmapped keys), created_at, updated_at.

const databaseSchema = {
  "crop-fields": {
    table: "crop_fields",
    columns: [
      { field: "name", type: "text", required: true },
      { field: "size", type: "numeric", required: true, min: 0 },
      { field: "unit", type: "text", required: true },
      { field: "soilType", type: "text" },
      { field: "notes", type: "text" },
    ],
  },
  "planting-seasons": {
    table: "planting_seasons",
    rangeCheck: ["startDate", "endDate"],
    columns: [
      { field: "name", type: "text", required: true },
      { field: "startDate", type: "date", required: true },
      { field: "endDate", type: "date", required: true },
      { field: "notes", type: "text" },
    ],
  },
  "crops": {
    table: "crops",
    columns: [
      { field: "name", type: "text", required: true },
      { field: "variety", type: "text" },
      { field: "type", type: "text", required: true },
      { field: "status", type: "text", required: true },
      { field: "field", type: "uuid", ref: "crop-fields" },
      { field: "plantedDate", type: "date", required: true },
      { field: "harvestDate", type: "date" },
      { field: "plantingSeason", type: "uuid", ref: "planting-seasons" },
      { field: "relatedRecord", type: "text" },
      { field: "notes", type: "text" },
    ],
  },
  "bee-hive-types": {
    table: "bee_hive_types",
    columns: [
      { field: "name", type: "text", required: true },
      { field: "category", type: "text", required: true },
      { field: "description", type: "text", required: true },
      { field: "source", type: "text" },
    ],
  },
  "bee-hives": {
    table: "bee_hives",
    columns: [
      { field: "hiveNumber", type: "text", required: true },
      { field: "hiveType", type: "uuid", ref: "bee-hive-types" },
      { field: "status", type: "text", required: true },
      { field: "location", type: "text" },
      // Current colony. Colonies also point back to their hive, so this side has no FK.
      { field: "colony", type: "uuid", ref: "bee-colonies", noFk: true },
      { field: "setupDate", type: "date" },
      { field: "cost", type: "numeric", min: 0 },
      { field: "notes", type: "text" },
    ],
  },
  "bee-colonies": {
    table: "bee_colonies",
    columns: [
      { field: "name", type: "text", required: true },
      { field: "beehive", type: "uuid", ref: "bee-hives" },
      { field: "breed", type: "text" },
      { field: "queenStatus", type: "text", required: true },
      { field: "strength", type: "text", required: true },
      { field: "status", type: "text" },
      { field: "established", type: "date" },
      { field: "ended", type: "date" },
      { field: "notes", type: "text" },
    ],
  },
  "hive-inspections": {
    table: "hive_inspections",
    columns: [
      { field: "targetType", type: "text", required: true },
      { field: "target", type: "text", required: true },
      { field: "inspectionDate", type: "date", required: true },
      { field: "inspector", type: "text", required: true },
      { field: "result", type: "text" },
      { field: "actions", type: "text" },
    ],
  },
  "honey-productions": {
    table: "honey_productions",
    columns: [
      { field: "hive", type: "uuid", ref: "bee-hives" },
      { field: "colony", type: "uuid", ref: "bee-colonies" },
      { field: "honeyType", type: "text", required: true },
      { field: "harvestDate", type: "date", required: true },
      { field: "quantity", type: "numeric", required: true, min: 0 },
      { field: "unit", type: "text", required: true },
      { field: "notes", type: "text" },
    ],
  },
  "animal-fields": {
    table: "animal_fields",
    columns: [
      { field: "name", type: "text", required: true },
      { field: "size", type: "numeric", required: true, min: 0 },
      { field: "unit", type: "text", required: true },
      { field: "notes", type: "text" },
    ],
  },
  "livestock-groups": {
    table: "livestock_groups",
    columns: [
      { field: "name", type: "text", required: true },
      { field: "label", type: "text", required: true },
      { field: "types", type: "text" },
      { field: "breed", type: "text" },
      { field: "tracking", type: "text", required: true },
      { field: "headCount", type: "int", min: 0 },
      { field: "status", type: "text" },
      { field: "purpose", type: "text" },
      { field: "location", type: "text" },
    ],
  },
  "animals": {
    table: "animals",
    columns: [
      { field: "name", type: "text", required: true },
      { field: "tag", type: "text", required: true },
      { field: "type", type: "text", required: true },
      { field: "breed", type: "text" },
      { field: "gender", type: "text" },
      { field: "health", type: "text", required: true },
      { field: "group", type: "uuid", ref: "livestock-groups" },
      { field: "field", type: "uuid", ref: "animal-fields" },
      { field: "birthDate", type: "date" },
      { field: "relatedRecord", type: "text" },
      { field: "notes", type: "text" },
    ],
  },
  "equipment": {
    table: "equipment",
    since: 5,
    columns: [
      { field: "name", type: "text", required: true },
      { field: "category", type: "text", required: true },
      { field: "make", type: "text" },
      { field: "model", type: "text" },
      { field: "serialNumber", type: "text" },
      { field: "purchaseDate", type: "date" },
      { field: "purchaseCost", type: "numeric", min: 0 },
      { field: "supplier", type: "text" },
      { field: "status", type: "text", required: true },
      { field: "location", type: "text" },
      { field: "hoursMeter", type: "numeric", min: 0 },
      { field: "warrantyExpiry", type: "date" },
      { field: "warrantyNotes", type: "text" },
      { field: "notes", type: "text" },
    ],
  },
  "equipment-services": {
    table: "equipment_services",
    since: 5,
    columns: [
      { field: "equipment", type: "uuid", ref: "equipment", required: true, onDelete: "cascade" },
      { field: "serviceType", type: "text", required: true },
      { field: "status", type: "text", required: true },
      { field: "serviceDate", type: "date", required: true },
      { field: "hoursAtService", type: "numeric", min: 0 },
      { field: "cost", type: "numeric", min: 0 },
      { field: "performedBy", type: "text" },
      { field: "nextServiceDate", type: "date" },
      { field: "nextServiceHours", type: "numeric", min: 0 },
      { field: "notes", type: "text" },
    ],
  },
  "feed-mixtures": {
    table: "feed_mixtures",
    columns: [
      { field: "name", type: "text", required: true },
      { field: "target", type: "text", required: true },
      { field: "ingredients", type: "text", required: true },
      { field: "notes", type: "text" },
    ],
  },
  "financial-records": {
    table: "financial_records",
    columns: [
      { field: "type", type: "text", required: true },
      { field: "category", type: "text", required: true },
      { field: "date", type: "date", required: true },
      { field: "amount", type: "numeric", required: true, min: 0 },
      { field: "reference", type: "text" },
      { field: "description", type: "text" },
      { field: "relatedRecord", type: "text" },
    ],
  },
  "users": {
    table: "system_users",
    columns: [
      { field: "name", type: "text", required: true },
      { field: "email", type: "text", required: true },
      { field: "role", type: "text", required: true },
    ],
  },
  "farm-workers": {
    table: "farm_workers",
    columns: [
      { field: "name", type: "text", required: true },
      { field: "jobTitle", type: "text" },
      { field: "phone", type: "text" },
      { field: "email", type: "text" },
      { field: "status", type: "text" },
      // Login of this worker (set when an invitation is accepted or by set_worker_account()).
      { field: "userId", type: "uuid", member: true, readOnly: true, since: 4 },
    ],
  },
  "tasks": {
    table: "tasks",
    columns: [
      { field: "title", type: "text", required: true },
      { field: "description", type: "text" },
      { field: "status", type: "text", required: true },
      { field: "priority", type: "text" },
      { field: "assignedTo", type: "uuid", ref: "farm-workers" },
      { field: "startDate", type: "date" },
      { field: "dueDate", type: "date" },
    ],
  },
  "worker-leaves": {
    table: "worker_leaves",
    rangeCheck: ["startDate", "endDate"],
    columns: [
      { field: "worker", type: "uuid", ref: "farm-workers" },
      { field: "leaveType", type: "text" },
      { field: "startDate", type: "date", required: true },
      { field: "endDate", type: "date", required: true },
      { field: "hours", type: "numeric", min: 0 },
      { field: "reason", type: "text" },
      { field: "status", type: "text", required: true },
    ],
  },
  // Holiday ids are text (e.g. "official-EG-2026-01-07-...") because they are generated
  // from the public-holiday service, so this table is keyed by (farm_id, id).
  "holidays": {
    table: "holidays",
    idType: "text",
    columns: [
      { field: "name", type: "text", required: true },
      { field: "date", type: "date", required: true },
      { field: "source", type: "text" },
      { field: "active", type: "bool", default: true },
      { field: "official", type: "bool", default: false },
      { field: "countryCode", type: "text" },
      { field: "regionCode", type: "text" },
      { field: "holidayProvider", type: "text" },
    ],
  },
};

// Parents first, so foreign keys can be created / rows upserted in this order.
const databaseTableOrder = [
  "crop-fields", "planting-seasons", "crops",
  "bee-hive-types", "bee-hives", "bee-colonies", "hive-inspections", "honey-productions",
  "animal-fields", "livestock-groups", "animals", "feed-mixtures",
  "equipment", "equipment-services",
  "financial-records",
  "users", "farm-workers", "tasks", "worker-leaves", "holidays",
];

// Migration file that creates the tables / columns introduced by a "since" number.
const databaseMigrationFiles = { 4: "004_team_invitations.sql", 5: "005_equipment.sql" };

function toSnakeCase(value) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// Column name for a spec entry: relations become <name>_id (field -> field_id).
function databaseColumnName(column) {
  return column.ref ? `${toSnakeCase(column.field)}_id` : toSnakeCase(column.field);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { databaseSchema, databaseTableOrder, databaseColumnName, toSnakeCase, databaseMigrationFiles };
}
