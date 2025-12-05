// apps/electron-ui/src/components/ModelDownloadPanel.tsx
import React, { useState } from "react";
import { MODEL_CATALOG } from "../modelCatalog";

declare global {
  interface Window {
    technetium?: {
      downloadModel?: (id: string) => Promise<any>;
    };
  }
}

const ModelDownloadPanel: React.FC = () => {
  const [selectedId, setSelectedId] = useState("deepseek-1.3b-q4");
  const [status, setStatus] = useState<string>("No model selected yet.");
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    if (!window.technetium?.downloadModel) {
      setStatus("downloadModel is not available (preload issue).");
      return;
    }

    setBusy(true);
    setStatus("Downloading model...");
    try {
      const res = await window.technetium.downloadModel(selectedId);
      if (res.ok) {
        setStatus(res.message || "Download complete.");
      } else {
        setStatus("Failed: " + (res.error || "Unknown error"));
      }
    } catch (err: any) {
      setStatus("Error: " + err?.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ fontSize: 13 }}>
      <h3 style={{ marginBottom: 8 }}>Models</h3>
      <div style={{ marginBottom: 8, color: "#666" }}>
        Download a local coding model (.gguf). After download, start
        <code> llama-server.exe -m &lt;path&gt; --port 11434</code> with that file.
      </div>

      <div style={{ maxHeight: 160, overflowY: "auto", marginBottom: 8 }}>
        {MODEL_CATALOG.map((m) => (
          <label
            key={m.id}
            style={{ display: "block", marginBottom: 4, cursor: "pointer" }}
          >
            <input
              type="radio"
              name="model-choice"
              value={m.id}
              checked={selectedId === m.id}
              onChange={() => setSelectedId(m.id)}
              style={{ marginRight: 6 }}
            />
            <b>{m.name}</b> — {m.size}
            <div style={{ fontSize: 12, color: "#777", marginLeft: 18 }}>
              {m.description}
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={handleDownload}
        disabled={busy}
        style={{
          padding: "6px 12px",
          fontSize: 13,
          cursor: busy ? "default" : "pointer",
        }}
      >
        {busy ? "Downloading…" : "Download / Use this model"}
      </button>

      <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
        Status: {status}
      </div>
    </div>
  );
};

export default ModelDownloadPanel;