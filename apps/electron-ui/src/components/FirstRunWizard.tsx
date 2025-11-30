import React, { useState } from 'react';

type ModelEntry = {
  id: string;
  name: string;
  url: string;
  sha?: string;
  size?: string;
  license?: string;
};

const MODELS: ModelEntry[] = [
  {
    id: 'demo-small',
    name: 'Demo Model (small, 10MB)',
    url: 'https://speed.hetzner.de/5MB.bin',
    sha: '',
    size: '10 MB',
    license: 'MIT',
  },
  {
    id: 'codellm-4b',
    name: 'CodeLLM 4-bit (demo)',
    url: 'https://example.com/codellm-demo.gguf',
    sha: '',
    size: '2 GB',
    license: 'Apache-2.0',
  },
];

export default function FirstRunWizard() {
  const [selectedId, setSelectedId] = useState(MODELS[0].id);
  const [accepted, setAccepted] = useState(false);
  const [log, setLog] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  const selected = MODELS.find((m) => m.id === selectedId)!;

  async function handleDownload() {
    if (!accepted) return alert('Please accept the model license first.');
    setDownloading(true);
    setLog('Starting download...');
    try {
      // @ts-ignore window.technetium typed in preload
      const out: string = await (window as any).technetium.downloadModel(selected.url, selected.sha);
      setLog(String(out || 'Downloaded successfully'));
    } catch (e: any) {
      setLog('Download failed: ' + (e?.message || String(e)));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div style={{ padding: 12, width: 360, borderRight: '1px solid #ddd', boxSizing: 'border-box' }}>
      <h3>First run — choose a model</h3>
      <div>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={{ width: '100%', padding: 8 }}>
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.size}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 10 }}>
        <b>License:</b> {selected.license}
      </div>

      <div style={{ marginTop: 8 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          I accept the license and the model will be downloaded to the app data folder.
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={handleDownload} disabled={downloading} style={{ padding: '8px 12px' }}>
          {downloading ? 'Downloading...' : 'Download & Verify'}
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>{log}</pre>
      </div>
    </div>
  );
}
