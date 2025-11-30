// apps/electron-ui/src/ui/AppUI.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import FirstRunWizard from '../components/FirstRunWizard';
import ModelManager from '../components/ModelManager';
import * as monaco from 'monaco-editor';

export default function AppUI(){
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor|null>(null);
  const containerRef = useRef<HTMLDivElement|null>(null);
  const [dark, setDark] = useState<boolean>(true);
  const [modelStatus, setModelStatus] = useState<'running'|'stopped'|'unknown'>('unknown');

  useEffect(()=>{
    // theme on body
    if(dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  },[dark]);

  useEffect(()=>{
    if(containerRef.current && !editorRef.current){
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: `// Technetium IDE — ${new Date().toLocaleString()}\nfunction hello(){\n  console.log("hi");\n}\n`,
        language: 'javascript',
        minimap: { enabled: false },
        automaticLayout: true,
        theme: dark ? 'vs-dark' : 'vs',
        fontSize: 13,
      });
    }
    // sync monaco theme on toggle
    return () => {};
  },[containerRef, dark]);

  // quick ping to model health every 5s (uses preload)
  useEffect(()=>{
    let t: any = null;
    async function tick(){
      try{
        // @ts-ignore
        const res = await (window as any).technetium.getHealth();
        setModelStatus(res?.ok ? 'running' : 'stopped');
      }catch(e){ setModelStatus('stopped'); }
    }
    tick();
    t = setInterval(tick, 5000);
    return ()=>clearInterval(t);
  },[]);

  return (
    <div className="app-shell">
      {/* Left column */}
      <aside style={{width:360, padding:12}} className="panel flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Technetium</h2>
            <div className="text-sm text-[color:var(--muted)]">Local AI IDE</div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-md text-sm`} style={{background: modelStatus==='running' ? 'rgba(16,185,129,0.12)' : 'rgba(220,38,38,0.08)'}}>
              <span style={{color: modelStatus==='running' ? 'var(--accent)' : 'var(--muted)'}}>{modelStatus==='running' ? 'Model running' : 'Stopped'}</span>
            </div>
            <button onClick={()=>setDark(d=>!d)} title="Toggle theme" className="p-1 rounded-md hover:bg-[color:var(--glass)]">
              {dark ? '🌙' : '☀️'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <FirstRunWizard />
        </div>

        <div>
          <ModelManager />
        </div>
      </aside>

      {/* Center editor */}
      <main style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>
        <div style={{display:'flex', alignItems:'center', gap:12, padding:'8px 12px'}} className="panel">
          <div className="flex-1 text-sm text-[color:var(--muted)]">Project: <b>untitled</b></div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded-md border" onClick={()=>{
              // save or open action
            }}>Files</button>
            <button className="px-3 py-1 rounded-md bg-[color:var(--accent)] text-white" onClick={async ()=>{
              // quick refine: call chat with selection
              const editor = editorRef.current!;
              const prompt = editor.getValue();
              try{
                const res = await fetch('http://127.0.0.1:11434/v1/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
                const json = await res.json();
                const text = json.choices?.[0]?.text || '';
                const pos = editor.getPosition();
                editor.executeEdits('ai',[{range:new monaco.Range(pos.lineNumber,pos.column,pos.lineNumber,pos.column), text}]);
              }catch(e){
                console.error(e);
              }
            }}>AI: Quick Assist</button>
          </div>
        </div>

        <div style={{flex:1, display:'flex', minHeight:0}}>
          <div style={{flex:1}} ref={containerRef} className="p-2" />
          {/* Right AI panel */}
          <aside style={{width:340, padding:12}} className="panel">
            <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.25}}>
              <div className="flex items-center justify-between">
                <h4 className="font-medium">AI Chat</h4>
                <div className="text-sm text-[color:var(--muted)]">Local</div>
              </div>

              <div style={{marginTop:12}}>
                <div className="h-64 rounded-md border p-2 overflow-auto text-sm" style={{background:'transparent'}}>
                  <div className="text-[color:var(--muted)]">Ask the active model questions about your code, request refactors, or generate tests.</div>
                </div>
              </div>

              <div style={{marginTop:12, display:'flex', gap:8}}>
                <input placeholder="Type a question..." className="flex-1 p-2 rounded-md border bg-[color:var(--panel)]" />
                <button className="px-3 py-2 bg-[color:var(--accent)] text-white rounded-md">Send</button>
              </div>
            </motion.div>
          </aside>
        </div>
      </main>
    </div>
  );
}