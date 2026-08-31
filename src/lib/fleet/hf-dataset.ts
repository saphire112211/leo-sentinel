/**
 * Reads fleet data from local Parquet files (downloaded HF dataset) via DuckDB.
 *
 * Local path: data/dataset/data/*.parquet
 * Refresh: POST /api/fleet/refresh re-downloads from HF
 */

import type { DuckDBInstance } from '@duckdb/node-api';
import { existsSync } from 'fs';
import { join } from 'path';
import fleetSnapshot from './fleet-snapshot.json';

interface BundledDailyRow {
  date: string;
  shell_id: number;
  total_count: number;
  operational_count: number;
  raising_count: number;
  deorbiting_count: number;
  reentered_count: number;
  isl_operational_count: number;
  avg_altitude: number;
  min_altitude: number;
  max_altitude: number;
  new_launches: number;
  anomalous_count: number;
}

interface BundledLatestRow {
  norad_id: number;
  name: string;
  status: string;
  altitude_km: number;
  shell_id: number;
  launch_year: number;
  raan: number;
  mean_motion: number;
  inclination: number;
  epoch_ts: number;
}

const BUNDLED_DAILY = fleetSnapshot.daily as BundledDailyRow[];
const BUNDLED_LATEST = fleetSnapshot.latest as BundledLatestRow[];

function hasDataset(path: string): boolean {
  return process.env.FLEET_FORCE_BUNDLED !== 'true' && existsSync(path);
}

// ── Paths ──────────────────────────────────────────────────────────────

const DATASET_DIR = join(process.cwd(), 'data/dataset/data');
const DAILY_PATH = join(DATASET_DIR, 'daily_snapshots.parquet');
const TLE_PATH = join(DATASET_DIR, 'tle_snapshots.parquet');
const LATEST_PATH = join(DATASET_DIR, 'latest_satellites.parquet');

// ── DuckDB connection (singleton) ──────────────────────────────────────

let dbPromise: Promise<DuckDBInstance> | null = null;

async function getDb(): Promise<DuckDBInstance> {
  if (!dbPromise) {
    // Keep the optional native binding out of serverless functions that only
    // serve the bundled/cache fallback. Docker and local dataset installs still
    // load DuckDB normally as soon as a Parquet-backed query is requested.
    dbPromise = import('@duckdb/node-api').then(({ DuckDBInstance }) =>
      DuckDBInstance.create(),
    );
  }
  return dbPromise;
}

async function query<T>(sql: string): Promise<T[]> {
  const db = await getDb();
  const conn = await db.connect();
  try {
    const result = await conn.run(sql);
    const rows: T[] = [];
    for (let c = 0; c < result.chunkCount; c++) {
      const chunk = result.getChunk(c);
      const raw = chunk.getRows();
      // Build objects from column names
      const names: string[] = [];
      for (let i = 0; i < result.columnCount; i++) {
        names.push(result.columnName(i));
      }
      for (const row of raw) {
        const obj: Record<string, unknown> = {};
        for (let i = 0; i < names.length; i++) {
          let val = row[i];
          // Convert BigInt to number (DuckDB returns BIGINT for COUNT/SUM)
          if (typeof val === 'bigint') val = Number(val);
          // Convert DuckDB timestamp objects to ISO string
          else if (val && typeof val === 'object' && 'micros' in val) {
            val = new Date(Number(BigInt((val as { micros: bigint }).micros) / BigInt(1000))).toISOString();
          }
          else if (val && typeof val === 'object' && 'nanos' in val) {
            val = new Date(Number(BigInt((val as { nanos: bigint }).nanos) / BigInt(1000000))).toISOString();
          }
          // Convert any nested BigInts (e.g. in structs)
          else if (val && typeof val === 'object') {
            val = JSON.parse(JSON.stringify(val, (_, v) => typeof v === 'bigint' ? Number(v) : v));
          }
          obj[names[i]] = val;
        }
        rows.push(obj as T);
      }
    }
    return rows;
  } finally {
    conn.disconnectSync();
  }
}

// ── Input validation ───────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}/;

function validateDate(d: string | undefined): string | undefined {
  if (!d) return undefined;
  if (!ISO_DATE_RE.test(d)) return undefined;
  return d.slice(0, 10); // only keep YYYY-MM-DD
}

function sanitizeSearchQuery(q: string): string {
  // Strip everything except alphanumeric, dash, space
  return q.replace(/[^a-zA-Z0-9\- ]/g, '').slice(0, 50);
}

// ── Public API ─────────────────────────────────────────────────────────

/** Clear DuckDB connection — forces fresh reads on next query */
export async function clearCache(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      db.closeSync();
    } catch { /* ignore */ }
  }
  dbPromise = null;
}

export async function getShellsSummary() {
  if (!hasDataset(DAILY_PATH)) {
    const lastDate = BUNDLED_DAILY.at(-1)?.date ?? null;
    return {
      shells: lastDate ? BUNDLED_DAILY.filter((row) => row.date === lastDate) : [],
      recordCount: new Set(BUNDLED_DAILY.map((row) => row.date)).size,
      lastIngest: lastDate ? `${lastDate}T00:00:00.000Z` : null,
    };
  }

  const shells = await query<Record<string, unknown>>(`
    WITH latest AS (SELECT MAX(date) as d FROM read_parquet('${DAILY_PATH}'))
    SELECT * FROM read_parquet('${DAILY_PATH}')
    WHERE date = (SELECT d FROM latest)
  `);

  const stats = await query<{ cnt: number; last: string }>(`
    SELECT COUNT(DISTINCT date) as cnt, MAX(date) as last
    FROM read_parquet('${DAILY_PATH}')
  `);

  return {
    shells,
    recordCount: stats[0]?.cnt ?? 0,
    lastIngest: stats[0]?.last ?? null,
  };
}

export async function getGrowthData(from?: string, to?: string) {
  const safeFrom = validateDate(from);
  const safeTo = validateDate(to);
  if (!hasDataset(DAILY_PATH)) {
    return BUNDLED_DAILY.filter((row) =>
      (!safeFrom || row.date >= safeFrom) && (!safeTo || row.date <= safeTo));
  }

  const where: string[] = [];
  if (safeFrom) where.push(`date >= '${safeFrom}'`);
  if (safeTo) where.push(`date <= '${safeTo}'`);
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  return query(`
    SELECT date, shell_id, operational_count, total_count,
           raising_count, deorbiting_count, isl_operational_count
    FROM read_parquet('${DAILY_PATH}')
    ${whereClause}
    ORDER BY date, shell_id
  `);
}

export async function getLaunchData(from?: string, to?: string) {
  const safeFrom = validateDate(from);
  const safeTo = validateDate(to);
  if (!hasDataset(DAILY_PATH)) {
    const launches = new Map<string, number>();
    for (const row of BUNDLED_DAILY) {
      if ((safeFrom && row.date < safeFrom) || (safeTo && row.date > safeTo)) continue;
      launches.set(row.date, (launches.get(row.date) ?? 0) + row.new_launches);
    }
    return [...launches.entries()].map(([date, new_launches]) => ({ date, new_launches }));
  }

  const where: string[] = [];
  if (safeFrom) where.push(`date >= '${safeFrom}'`);
  if (safeTo) where.push(`date <= '${safeTo}'`);
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  return query(`
    SELECT date, SUM(new_launches) as new_launches
    FROM read_parquet('${DAILY_PATH}')
    ${whereClause}
    GROUP BY date
    ORDER BY date
  `);
}

export async function getAltitudeData(_date?: string) {
  if (hasDataset(LATEST_PATH)) {
    return query(`
      SELECT norad_id, altitude_km, shell_id, status
      FROM read_parquet('${LATEST_PATH}')
    `);
  }
  return BUNDLED_LATEST.map(({ norad_id, altitude_km, shell_id, status }) => ({
    norad_id,
    altitude_km,
    shell_id,
    status,
  }));
}

export async function getPlaneData(shellId: number) {
  // Use latest_satellites (pre-computed latest per sat) — much faster than scanning tle_snapshots
  if (hasDataset(LATEST_PATH)) {
    return query(`
      SELECT raan, altitude_km, mean_motion, inclination, epoch_ts
      FROM read_parquet('${LATEST_PATH}')
      WHERE shell_id = ${shellId}
    `);
  }
  return BUNDLED_LATEST
    .filter((row) => row.shell_id === shellId)
    .map(({ raan, altitude_km, mean_motion, inclination, epoch_ts }) => ({
      raan,
      altitude_km,
      mean_motion,
      inclination,
      epoch_ts,
    }));
}

export async function getKpis() {
  const result: Record<string, number> = {
    total: 0, operational: 0, islCapable: 0, raising: 0, deorbiting: 0, decayed: 0, launched2026: 0,
  };

  if (!hasDataset(DAILY_PATH)) {
    const lastDate = BUNDLED_DAILY.at(-1)?.date;
    for (const row of BUNDLED_DAILY) {
      if (row.date !== lastDate) continue;
      result.total += row.total_count;
      result.operational += row.operational_count;
      result.islCapable += row.isl_operational_count;
      result.raising += row.raising_count;
      result.deorbiting += row.deorbiting_count;
    }
    return result;
  }

  const rows = await query<Record<string, number>>(`
    WITH latest AS (SELECT MAX(date) as d FROM read_parquet('${DAILY_PATH}'))
    SELECT SUM(total_count) as total, SUM(operational_count) as operational,
           SUM(isl_operational_count) as isl_capable,
           SUM(raising_count) as raising, SUM(deorbiting_count) as deorbiting
    FROM read_parquet('${DAILY_PATH}') WHERE date = (SELECT d FROM latest)
  `);
  if (rows[0]) {
    result.total = rows[0].total ?? 0;
    result.operational = rows[0].operational ?? 0;
    result.islCapable = rows[0].isl_capable ?? 0;
    result.raising = rows[0].raising ?? 0;
    result.deorbiting = rows[0].deorbiting ?? 0;
  }

  return result;
}

export async function getVintageData() {
  if (!hasDataset(LATEST_PATH)) {
    const counts = new Map<string, { launch_year: number; status: string; count: number }>();
    for (const row of BUNDLED_LATEST) {
      const key = `${row.launch_year}:${row.status}`;
      const current = counts.get(key) ?? { launch_year: row.launch_year, status: row.status, count: 0 };
      current.count += 1;
      counts.set(key, current);
    }
    return [...counts.values()].sort((left, right) =>
      left.launch_year - right.launch_year || left.status.localeCompare(right.status));
  }
  return query(`
    SELECT launch_year, status, COUNT(*) as count
    FROM read_parquet('${LATEST_PATH}')
    GROUP BY launch_year, status
    ORDER BY launch_year, status
  `);
}

export async function searchSatellites(q: string, limit = 20) {
  const safe = sanitizeSearchQuery(q);
  if (safe.length < 2) return [];

  if (!hasDataset(LATEST_PATH)) {
    const normalized = safe.toLowerCase();
    const isNumeric = /^\d+$/.test(safe);
    return BUNDLED_LATEST
      .filter((row) => isNumeric
        ? row.norad_id === Number(safe)
        : row.name.toLowerCase().includes(normalized))
      .sort((left, right) => left.name.localeCompare(right.name))
      .slice(0, limit)
      .map(({ norad_id, name, status, altitude_km, shell_id, launch_year }) => ({
        norad_id,
        name,
        status,
        altitude_km,
        shell_id,
        launch_year,
      }));
  }

  const isNumeric = /^\d+$/.test(safe);
  const where = isNumeric
    ? `norad_id = ${parseInt(safe)}`
    : `name ILIKE '%${safe}%'`;
  return query(`
    SELECT norad_id, name, status, altitude_km, shell_id, launch_year
    FROM read_parquet('${LATEST_PATH}')
    WHERE ${where}
    ORDER BY name
    LIMIT ${limit}
  `);
}

export async function getSatelliteHistory(noradId: number) {
  if (!hasDataset(TLE_PATH)) {
    const row = BUNDLED_LATEST.find((candidate) => candidate.norad_id === noradId);
    return row ? [{
      epoch_utc: new Date(row.epoch_ts * 1000).toISOString(),
      altitude_km: row.altitude_km,
      status: row.status,
    }] : [];
  }

  return query(`
    SELECT epoch_utc, altitude_km, status
    FROM read_parquet('${TLE_PATH}')
    WHERE norad_id = ${noradId}
    ORDER BY epoch_utc
  `);
}
