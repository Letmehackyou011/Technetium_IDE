import React, { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import ChatPanel from "../components/ChatPanel";
import ModelDownloadPanel from "../components/ModelDownloadPanel";
import FileExplorer, { TreeNode } from "../components/FileExplorer";

declare global {
  interface Window {
    technetium?: any;
  }
}

type OpenTab = {
  path: string;
  label: string;
};

const AppUI: React.FC = () => {
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const [dark, setDark] = useState(true);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [workspaceRoot, setWorkspaceRoot] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // init editor
  useEffect(() => {
    if (!editorRef.current && editorContainerRef.current) {
      editorRef.current = monaco.editor.create(editorContainerRef.current, {
        value:
          `// Technetium IDE — ${new Date().toLocaleString()}\n` +
          `function hello(){\n  console.log("hi");\n}\n`,
        language: "javascript",
        theme: "vs-dark",
        minimap: { enabled: false },
        automaticLayout: true,
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: 13,
      });
    }
  }, []);

  // theme
  useEffect(() => {
    document.body.classList.toggle("dark", dark);
    if (editorRef.current) {
      monaco.editor.setTheme(dark ? "vs-dark" : "vs");
    }
  }, [dark]);

  async function handleOpenFolder() {
    const res = await window.technetium?.openFolder?.();
    if (res?.ok) {
      setTree(res.tree);
      setWorkspaceRoot(res.root);
      setOpenTabs([]);
      setActiveTab(null);
      editorRef.current?.setValue("");
    } else if (!res?.canceled) {
      alert("Failed to open folder: " + (res?.error || "Unknown error"));
    }
  }

  async function handleRefresh() {
    if (!workspaceRoot) return;
    const res = await window.technetium?.openFolder?.();
    // simple approach: just reopen root dialog again is annoying;
    // for now, we ignore refresh and rely on operations updating tree.
    // You can wire a dedicated "get-tree" later if you want.
  }

  async function handleOpenFile(node: TreeNode) {
    const res = await window.technetium?.readFile?.(node.fullPath);
    if (!res?.ok) {
      alert("Failed to read file: " + (res?.error || "Unknown error"));
      return;
    }
    editorRef.current?.setValue(res.text || "");
    setActiveTab(node.fullPath);
    setOpenTabs((tabs) => {
      if (tabs.find((t) => t.path === node.fullPath)) return tabs;
      return [...tabs, { path: node.fullPath, label: node.name }];
    });
  }

  async function handleSave() {
    if (!activeTab || !editorRef.current) return;
    setSaving(true);
    try {
      const text = editorRef.current.getValue();
      const res = await window.technetium?.writeFile?.(activeTab, text);
      if (!res?.ok) {
        alert("Failed to save file: " + (res?.error || "Unknown error"));
      }
    } finally {
      setSaving(false);
    }
  }

  function closeTab(path: string) {
    setOpenTabs((tabs) => tabs.filter((t) => t.path !== path));
    if (activeTab === path) {
      const remaining = openTabs.filter((t) => t.path !== path);
      const next = remaining[remaining.length - 1];
      setActiveTab(next ? next.path : null);
      if (next) {
        window.technetium
          ?.readFile?.(next.path)
          .then((res: any) => res?.ok && editorRef.current?.setValue(res.text));
      } else {
        editorRef.current?.setValue("");
      }
    }
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont',
      }}
    >
      {/* Activity bar (left icons) */}
      <div
        style={{
          width: 48,
          background: "#20232a",
          color: "#eee",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 8,
          gap: 8,
          fontSize: 20,
        }}
      >
        <div title="Explorer">📁</div>
        <div title="Search">🔍</div>
        <div title="Extensions">🧩</div>
      </div>

      {/* Main column: sidebar + editor */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Title bar mimic */}
        <div
          style={{
            height: 28,
            background: "#2d2d2d",
            color: "#ddd",
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            fontSize: 12,
          }}
        >
          <span style={{ opacity: 0.8 }}>
            Technetium IDE — {workspaceRoot || "No Folder Opened"}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={() => setDark((d) => !d)}
              style={{
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 3,
                border: "1px solid #555",
                background: dark ? "#3a3a3a" : "#f0f0f0",
                color: dark ? "#fff" : "#111",
              }}
            >
              {dark ? "☀" : "🌙"}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex" }}>
          {/* Sidebar like VS Code (Explorer, Models, Chat) */}
          <aside
            style={{
              width: 320,
              borderRight: "1px solid #333",
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              background: dark ? "#1e1e1e" : "#f5f5f5",
              color: dark ? "#f5f5f5" : "#111",
            }}
          >
            <FileExplorer
              tree={tree}
              workspaceRoot={workspaceRoot}
              onOpenFolder={handleOpenFolder}
              onOpenFile={handleOpenFile}
              onRefresh={handleRefresh}
            />

            <div
              style={{
                padding: 8,
                borderRadius: 6,
                border: "1px solid #333",
                background: dark ? "#181818" : "#ffffff",
              }}
            >
              <ModelDownloadPanel />
            </div>

            <div
              style={{
                marginTop: 4,
                paddingTop: 4,
                borderTop: "1px solid #333",
                flex: 1,
                minHeight: 0,
              }}
            >
              <ChatPanel />
            </div>
          </aside>

          {/* Editor area */}
          <main
            style={{
              flex: 1,
              background: dark ? "#1e1e1e" : "#ffffff",
              color: dark ? "#eee" : "#111",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Tabs bar */}
            <div
              style={{
                height: 28,
                display: "flex",
                alignItems: "center",
                background: dark ? "#252526" : "#e1e1e1",
                borderBottom: "1px solid #333",
                overflowX: "auto",
              }}
            >
              {openTabs.map((tab) => (
                <div
                  key={tab.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 8px",
                    fontSize: 12,
                    cursor: "pointer",
                    background:
                      activeTab === tab.path
                        ? dark
                          ? "#1e1e1e"
                          : "#ffffff"
                        : "transparent",
                    borderRight: "1px solid #333",
                  }}
                  onClick={() => {
                    setActiveTab(tab.path);
                    window.technetium
                      ?.readFile?.(tab.path)
                      .then((res: any) =>
                        res?.ok && editorRef.current?.setValue(res.text)
                      );
                  }}
                >
                  <span style={{ marginRight: 6 }}>{tab.label}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.path);
                    }}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>

            {/* Editor */}
            <div
              ref={editorContainerRef}
              style={{ flex: 1, minHeight: 0 }}
            />

            {/* Status bar */}
            <div
              style={{
                height: 22,
                background: "#007acc",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 8px",
                fontSize: 11,
              }}
            >
              <span>
                {activeTab
                  ? activeTab.replace(workspaceRoot || "", "")
                  : "No file"}
              </span>
              <span>
                {saving ? "Saving..." : "Ready"} | AI: Local | Press Ctrl+S to
                save (future)
              </span>
              <button
                onClick={handleSave}
                disabled={!activeTab || saving}
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 3,
                  border: "none",
                  background: "#fff",
                  color: "#007acc",
                  cursor: !activeTab || saving ? "default" : "pointer",
                  opacity: !activeTab ? 0.6 : 1,
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppUI;