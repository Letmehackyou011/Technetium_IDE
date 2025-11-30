// apps/electron-ui/src/components/ModelManager.tsx
import React, { useEffect, useState } from 'react';

export default function ModelManager() {
  const [status, setStatus] = useState<{ ok: boolean; data?: any; error?: any }>({ ok: false });
  const [last, setLast] = useState<string>('');

  async function refresh() {
    try {
      // @ts-ignore
      const res = await (window as any).technetium.getHealth();
      setStatus(res);
      setLast(new Date().toLocaleTimeString());
    } catch (e: any) {
      setStatus({ ok: false, error: String(e) });
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, []);

  async function startModel() {
    setLast('Starting...');
    // @ts-ignore
    const res = await (window as any).technetium.startModel();
    setLast(JSON.stringify(res));
    setTimeout(refresh, 1000);
  }

  async function stopModel() {
    setLast('Stopping...');
    // @ts-ignore
    const res = await (window as any).technetium.stopModel();
    setLast(JSON.stringify(res));
    setTimeout(refresh, 1000);
  }

  return (
    <div style={{ padding: 12, width: 280, borderLeft: '1px solid #ddd', boxSizing: 'border-box' }}>
      <h4>Model Manager</h4>
      <div>
        <b>Status:</b> {status.ok ? 'Running' : 'Stopped'}
      </div>
      {status.ok && <div style={{ marginTop: 6 }}><small>Data: {JSON.stringify(status.data)}</small></div>}
      {status.error && <div style={{ marginTop: 6, color: 'red' }}>Error: {String(status.error)}</div>}

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button onClick={startModel} style={{ padding: '6px 10px' }}>Start</button>
        <button onClick={stopModel} style={{ padding: '6px 10px' }}>Stop</button>
        <button onClick={() => refresh()} style={{ padding: '6px 10px' }}>Refresh</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <small>Last: {last}</small>
      </div>
    </div>
  );
}