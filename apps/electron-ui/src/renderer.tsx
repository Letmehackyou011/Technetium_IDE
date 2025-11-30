// apps/electron-ui/src/renderer.tsx
import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import * as monaco from 'monaco-editor';
import FirstRunWizard from './components/FirstRunWizard';
import ModelManager from './components/ModelManager';
import './ui/styles.css'
import AppUI from './ui/AppUI';


createRoot(document.getElementById('root')!).render(<AppUI />);
const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: '// Technetium IDE — start coding\nfunction hello() {\n  console.log(\"hello world\");\n}\n',
        language: 'javascript',
        automaticLayout: true,
      });
    }
  }, []);

  async function chatWithModel() {
    const prompt = editorRef.current?.getValue() || '';
    try {
      const res = await fetch('http://127.0.0.1:11434/v1/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      const text = json.choices?.[0]?.text || '';
      const pos = editorRef.current!.getPosition();
      editorRef.current!.executeEdits('ai', [
        {
          range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
          text,
        },
      ]);
    } catch (e) {
      alert('Failed to reach model server. Ensure model is running (use Model Manager).');
      console.error(e);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', gap: 0 }}>
      <div style={{ width: 360 }}>
        <FirstRunWizard />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }} ref={containerRef} />
        <div style={{ padding: 8, borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
          <button onClick={chatWithModel} style={{ padding: '8px 12px' }}>Chat with model</button>
        </div>
      </div>

      <div style={{ width: 280 }}>
        <ModelManager />
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);