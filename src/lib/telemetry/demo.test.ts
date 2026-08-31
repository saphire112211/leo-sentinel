import { describe, expect, it } from 'vitest';
import { createDemoTelemetrySample } from './demo';

describe('browser demo telemetry', () => {
  it('produces connected, plausible zero-cost demo values', () => {
    const sample = createDemoTelemetrySample(10, null, null);
    expect(sample.state).toBe('CONNECTED');
    expect(sample.deviceId).toContain('demo');
    expect(sample.downlink).toBeGreaterThan(0);
    expect(sample.uplink).toBeGreaterThan(0);
    expect(sample.gpsSats).toBeGreaterThan(0);
  });

  it('uses calculated geometric latency and preserves scene angles', () => {
    const previous = createDemoTelemetrySample(0, null, null);
    previous.azimuth = 42;
    previous.elevation = 61;
    const sample = createDemoTelemetrySample(1, previous, 27.5);
    expect(sample.ping).toBe(27.5);
    expect(sample.azimuth).toBe(42);
    expect(sample.elevation).toBe(61);
  });
});
