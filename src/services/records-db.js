// Maps Fieldwise records to rows of the per-resource Postgres tables and back.
// The table layout lives in src/data/db-schema.js (also used to generate the SQL migrations).
// Relies on globals from earlier scripts: sb, databaseSchema, databaseTableOrder, databaseColumnName,
// emptyStore.

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cloudPageSize = 1000;
const cloudWriteBatchSize = 500;

function toDbValue(column, value) {
  switch (column.type) {
    case "text":
      return value === undefined || value === null ? "" : String(value);
    case "numeric":
    case "int": {
      const text = String(value ?? "").trim();
      if (text === "") return null;
      const number = Number(text);
      if (!Number.isFinite(number)) return null;
      return column.type === "int" ? Math.round(number) : number;
    }
    case "date": {
      const text = String(value ?? "").trim();
      return text === "" ? null : text;
    }
    case "bool":
      return value === undefined || value === null ? Boolean(column.default) : Boolean(value);
    case "uuid": {
      const text = String(value ?? "").trim();
      return uuidPattern.test(text) ? text : null;
    }
    default:
      throw new Error(`Unknown column type: ${column.type}`);
  }
}

function fromDbValue(column, value) {
  switch (column.type) {
    case "numeric":
    case "int":
      return value === null || value === undefined ? "" : String(value);
    case "bool":
      return value === null || value === undefined ? Boolean(column.default) : Boolean(value);
    default:
      return value === null || value === undefined ? "" : value;
  }
}

function recordToRow(resourceId, record, farmId) {
  const spec = databaseSchema[resourceId];
  const id = String(record.id);
  if (spec.idType !== "text" && !uuidPattern.test(id)) {
    throw new Error(`Record id "${id}" in ${resourceId} is not a valid UUID.`);
  }

  const row = { id, farm_id: farmId };
  const mapped = new Set(["id", "createdAt", "updatedAt"]);
  for (const column of spec.columns) {
    mapped.add(column.field);
    // Read-only columns (e.g. farm_workers.user_id) are set by database functions only, so a
    // stale copy of a record can never overwrite them.
    if (column.readOnly) continue;
    row[databaseColumnName(column)] = toDbValue(column, record[column.field]);
  }

  // Anything the table has no column for is kept, not dropped.
  const extra = {};
  for (const [key, value] of Object.entries(record)) {
    if (!mapped.has(key)) extra[key] = value;
  }
  row.extra = extra;
  row.created_at = record.createdAt || new Date().toISOString();
  // created_by defaults to auth.uid() and updated_at is set by a trigger, so neither is sent.
  return row;
}

function rowToRecord(resourceId, row) {
  const spec = databaseSchema[resourceId];
  const record = { ...(row.extra && typeof row.extra === "object" ? row.extra : {}), id: row.id };
  for (const column of spec.columns) {
    record[column.field] = fromDbValue(column, row[databaseColumnName(column)]);
  }
  record.createdAt = row.created_at;
  record.updatedAt = row.updated_at;
  return record;
}

function cloudError(error, table) {
  const wrapped = new Error(`${table}: ${error.message || "request failed"}`);
  wrapped.cause = error;
  return wrapped;
}

async function fetchAllRows(table, farmId) {
  const rows = [];
  for (let from = 0; ; from += cloudPageSize) {
    const { data, error } = await sb
      .from(table)
      .select("*")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + cloudPageSize - 1);
    if (error) throw cloudError(error, table);
    rows.push(...(data || []));
    if (!data || data.length < cloudPageSize) return rows;
  }
}

// Loads every resource of one farm into a store-shaped object.
async function loadCloudRecords(farmId) {
  const loaded = emptyStore();
  await Promise.all(databaseTableOrder.map(async (resourceId) => {
    const rows = await fetchAllRows(databaseSchema[resourceId].table, farmId);
    loaded[resourceId] = rows.map((row) => rowToRecord(resourceId, row));
  }));
  return loaded;
}

// Applies upserts (parents before children, so foreign keys resolve) and then deletes.
async function persistCloudChanges(changes, farmId) {
  const tableRank = new Map(databaseTableOrder.map((id, index) => [id, index]));
  const upserts = changes
    .filter((change) => change.type === "upsert" && change.records.length)
    .sort((a, b) => tableRank.get(a.resourceId) - tableRank.get(b.resourceId));

  for (const change of upserts) {
    const table = databaseSchema[change.resourceId].table;
    const rows = change.records.map((record) => recordToRow(change.resourceId, record, farmId));
    for (let index = 0; index < rows.length; index += cloudWriteBatchSize) {
      const { error } = await sb
        .from(table)
        .upsert(rows.slice(index, index + cloudWriteBatchSize), { onConflict: "farm_id,id" });
      if (error) throw cloudError(error, table);
    }
  }

  for (const change of changes.filter((item) => item.type === "delete")) {
    const table = databaseSchema[change.resourceId].table;
    const { error } = await sb
      .from(table)
      .delete()
      .eq("farm_id", farmId)
      .eq("id", String(change.recordId));
    if (error) throw cloudError(error, table);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { toDbValue, fromDbValue, recordToRow, rowToRecord };
}
