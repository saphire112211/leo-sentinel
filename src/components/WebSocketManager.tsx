'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/lib/websocket/client';
import { createDemoTelemetrySample } from '@/lib/telemetry/demo';
import { useAppStore } from '@/stores/app-store';
import { useTelemetryStore } from '@/stores/telemetry-store';

export default function WebSocketManager() {
  const { connected } = useWebSocket();
  const demoMode = useAppStore((state) => state.demoMode);

  useEffect(() => {
    if (!demoMode || connected) return;
    const startedAt = Date.now();

    const update = () => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const store = useTelemetryStore.getState();
      const sample = createDemoTelemetrySample(
        elapsedSeconds,
        store.dishStatus,
        store.geometricLatency,
      );
      store.updateStatus(sample);
      store.pushHistory({
        ping: sample.ping,
        downlink: sample.downlink,
        uplink: sample.uplink,
        snr: sample.snr,
      });
    };

    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [connected, demoMode]);

  return null;
}
