import type { DishStatus } from '@/stores/telemetry-store';

export function createDemoTelemetrySample(
  elapsedSeconds: number,
  previous: DishStatus | null,
  geometricLatency: number | null,
): DishStatus {
  const downlinkMbps = 145 + Math.sin(elapsedSeconds / 7) * 28;
  const uplinkMbps = 18 + Math.sin(elapsedSeconds / 11) * 5;
  const snr = 10.8 + Math.sin(elapsedSeconds / 13) * 0.9;

  return {
    ping: geometricLatency ?? previous?.ping ?? 38 + Math.sin(elapsedSeconds / 9) * 4,
    downlink: downlinkMbps * 1_000_000 / 8,
    uplink: uplinkMbps * 1_000_000 / 8,
    snr,
    uptime: 86_400 + elapsedSeconds,
    state: 'CONNECTED',
    obstructions: 0.002,
    azimuth: previous?.azimuth ?? 0,
    elevation: previous?.elevation ?? 0,
    dropRate: 0.003 + Math.max(0, Math.sin(elapsedSeconds / 17)) * 0.002,
    gpsSats: 14,
    antennaBoresightAz: previous?.antennaBoresightAz ?? 0,
    antennaBoresightEl: previous?.antennaBoresightEl ?? 65,
    deviceId: 'demo-browser-client',
    softwareVersion: 'demo-2026.08',
  };
}
