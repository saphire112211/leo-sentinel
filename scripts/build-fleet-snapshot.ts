import { writeFile } from 'fs/promises';
import { join } from 'path';
import { DuckDBInstance } from '@duckdb/node-api';

const dataDirectory = join(process.cwd(), 'data/dataset/data').replaceAll('\\', '/');
const outputPath = join(process.cwd(), 'src/lib/fleet/fleet-snapshot.json');

async function query(sql: string): Promise<Array<Record<string, unknown>>> {
  const database = await DuckDBInstance.create();
  const connection = await database.connect();
  try {
    const result = await connection.run(sql);
    const names = Array.from({ length: result.columnCount }, (_, index) => result.columnName(index));
    const rows: Array<Record<string, unknown>> = [];
    for (let chunkIndex = 0; chunkIndex < result.chunkCount; chunkIndex += 1) {
      for (const row of result.getChunk(chunkIndex).getRows()) {
        rows.push(Object.fromEntries(names.map((name, index) => [name, normalize(row[index])])));
      }
    }
    return rows;
  } finally {
    connection.disconnectSync();
    database.closeSync();
  }
}

function normalize(value: unknown): unknown {
  if (typeof value === 'bigint') return Number(value);
  if (value && typeof value === 'object' && 'micros' in value) {
    return new Date(Number(BigInt((value as { micros: bigint }).micros) / BigInt(1000))).toISOString();
  }
  if (value && typeof value === 'object' && 'nanos' in value) {
    return new Date(Number(BigInt((value as { nanos: bigint }).nanos) / BigInt(1_000_000))).toISOString();
  }
  return value;
}

async function main(): Promise<void> {
  const daily = await query(`
    SELECT strftime(date, '%Y-%m-%d') AS date, shell_id, total_count,
           operational_count, raising_count, deorbiting_count,
           reentered_count, isl_operational_count, avg_altitude,
           min_altitude, max_altitude, new_launches, anomalous_count
    FROM read_parquet('${dataDirectory}/daily_snapshots.parquet')
    ORDER BY date, shell_id
  `);
  const latest = await query(`
    SELECT norad_id, name, status, altitude_km, shell_id, launch_year,
           raan, mean_motion, inclination, epoch_ts
    FROM read_parquet('${dataDirectory}/latest_satellites.parquet')
    ORDER BY norad_id
  `);
  await writeFile(outputPath, JSON.stringify({ daily, latest }));
  console.log(`Wrote ${daily.length} daily rows and ${latest.length} latest-satellite rows.`);
}

void main();
