import React from "react";

declare global {
  interface Window {
    technetium?: any;
  }
}

export type TreeNode = {
  type: "file" | "dir";
  name: string;
  fullPath: string;
  children?: TreeNode[];
};

type Props = {
  tree: TreeNode | null;
  workspaceRoot: string | null;
  onOpenFolder: () => void;
  onOpenFile: (node: TreeNode) => void;
  onRefresh: () => void;
};

const indentStyle = (depth: number) => ({ paddingLeft: depth * 12 });

const FileExplorer: React.FC<Props> = ({
  tree,
  workspaceRoot,
  onOpenFolder,
  onOpenFile,
  onRefresh,
}) => {
  async function handleNewFile(dir: string) {
    const name = window.prompt("File name:");
    if (!name) return;
    const res = await window.technetium?.newFile?.(dir, name);
    if (!res?.ok) alert("Failed to create file: " + (res?.error || ""));
    onRefresh();
  }

  async function handleNewFolder(dir: string) {
    const name = window.prompt("Folder name:");
    if (!name) return;
    const res = await window.technetium?.newFolder?.(dir, name);
    if (!res?.ok) alert("Failed to create folder: " + (res?.error || ""));
    onRefresh();
  }

  async function handleRename(node: TreeNode) {
    const name = window.prompt("New name:", node.name);
    if (!name || name === node.name) return;
    const parent = node.fullPath.slice(0, -node.name.length);
    const newPath = parent + name;
    const res = await window.technetium?.renameEntry?.(node.fullPath, newPath);
    if (!res?.ok) alert("Failed to rename: " + (res?.error || ""));
    onRefresh();
  }

  async function handleDelete(node: TreeNode) {
    if (!window.confirm(`Delete ${node.name}?`)) return;
    const res = await window.technetium?.deleteEntry?.(node.fullPath);
    if (!res?.ok) alert("Failed to delete: " + (res?.error || ""));
    onRefresh();
  }

  function renderNode(node: TreeNode, depth: number) {
    const isDir = node.type === "dir";
    return (
      <div key={node.fullPath}>
        <div
          style={{
            ...indentStyle(depth),
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            whiteSpace: "nowrap",
            fontSize: 13,
          }}
          onDoubleClick={() => {
            if (!isDir) onOpenFile(node);
          }}
        >
          <div
            style={{
              cursor: isDir ? "default" : "pointer",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            onClick={() => {
              if (!isDir) onOpenFile(node);
            }}
          >
            {isDir ? "📁 " : "📄 "}
            {node.name}
          </div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>
            {isDir ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNewFile(node.fullPath);
                  }}
                  title="New File"
                >
                  +
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNewFolder(node.fullPath);
                  }}
                  title="New Folder"
                >
                  📁
                </button>
              </>
            ) : null}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRename(node);
              }}
              title="Rename"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(node);
              }}
              title="Delete"
            >
              🗑
            </button>
          </div>
        </div>
        {node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <div style={{ fontSize: 13 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span style={{ fontWeight: 600 }}>EXPLORER</span>
        <button
          onClick={onOpenFolder}
          style={{
            fontSize: 11,
            padding: "2px 6px",
            borderRadius: 3,
            border: "1px solid #555",
            cursor: "pointer",
          }}
        >
          Open Folder…
        </button>
      </div>
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>
        {workspaceRoot || "No folder opened"}
      </div>
      <div
        style={{
          maxHeight: 260,
          overflowY: "auto",
          borderRadius: 4,
          border: "1px solid #333",
          padding: 4,
        }}
      >
        {tree ? renderNode(tree, 0) : <div>No folder. Click “Open Folder…”.</div>}
      </div>
    </div>
  );
};

export default FileExplorer;
