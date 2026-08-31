import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getAltitudeData,
  getGrowthData,
  getKpis,
  getPlaneData,
  getShellsSummary,
  getVintageData,
  searchSatellites,
} from './hf-dataset';

describe('bundled Fleet snapshot', () => {
  beforeEach(() => {
    process.env.FLEET_FORCE_BUNDLED = 'true';
  });

  afterEach(() => {
    delete process.env.FLEET_FORCE_BUNDLED;
  });

  it('keeps the public dashboard populated without Parquet access', async () => {
    const [shells, kpis, growth, altitudes, planes, vintage] = await Promise.all([
      getShellsSummary(),
      getKpis(),
      getGrowthData(),
      getAltitudeData(),
      getPlaneData(2),
      getVintageData(),
    ]);

    expect(shells.recordCount).toBeGreaterThanOrEqual(512);
    expect(shells.shells.length).toBeGreaterThan(0);
    expect(kpis.total).toBeGreaterThan(0);
    expect(growth.length).toBeGreaterThan(0);
    expect(altitudes.length).toBeGreaterThan(0);
    expect(planes.length).toBeGreaterThan(0);
    expect(vintage.length).toBeGreaterThan(0);
  });

  it('supports bundled satellite search', async () => {
    const matches = await searchSatellites('STARLINK', 3) as Array<{ name: string }>;
    expect(matches).toHaveLength(3);
    expect(matches.every((row) => row.name.includes('STARLINK'))).toBe(true);
  });
});
