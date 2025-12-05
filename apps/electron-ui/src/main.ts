// apps/electron-ui/src/main.ts
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import * as fs from "fs";
import { MODEL_CATALOG } from "./modelCatalog";

const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Technetium IDE",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    await mainWindow.loadURL("http://localhost:5173/");
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ---------- AI IPC ----------

ipcMain.handle("askModel", async (_e, userInput: string) => {
  try {
    const prompt = `
    RULES:
      1. NEVER continue the conversation.
      2. NEVER add "User:" or "Assistant:".
      3. NEVER explain unless asked.
      4. ONLY answer exactly what the user asked.
      5. If user asks "is this code correct?", reply only YES or NO + one-line reason.
      6. If user asks for code, output ONLY code inside triple backticks.
      7. NEVER generate training/testing examples.
      8. NEVER add story or assumptions.`.trim() +
      `You are Technetium, a local AI coding assistant.\n` +
      `Answer briefly and help the user with code, debugging, or explanations.\n\n` +
      `Give the code in the appropriate language as requested, and use markdown formatting where applicable.\n\n` +
      `User: ${userInput}\n` +
      `Assistant:`;


    const modelPath = (global as any).activeModelPath;

    if (!modelPath) {
      return "Error: No active model set. Please select a model first.";

    const res = await fetch("http://127.0.0.1:11434/completion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        n_predict: 150,
        temperature: 0.7,
        model: modelPath,
      }),
    });
    const json = await res.json();
    return (json as any).content || "⚠️ Model returned no text.";
  } catch (err: any) {
    console.error("askModel error:", err);
    return "Error: Cannot reach local LLM. Is llama-server running?";
  }
}

ipcMain.handle("download-model", async (_e, modelId: string) => {
  try {
    const info = MODEL_CATALOG.find((m) => m.id === modelId);
    if (!info) throw new Error(`Unknown model id: ${modelId}`);

    const runtimeDir = path.join(process.cwd(), "runtime", "models");
    await fs.promises.mkdir(runtimeDir, { recursive: true });
    const destPath = path.join(runtimeDir, info.filename);

    if (fs.existsSync(destPath)) {
      return {
        ok: true,
        alreadyExists: true,
        path: destPath,
        message: `Model already exists at ${destPath}`,
      };
    }

    const res = await fetch(info.url);
    if (!res.ok) throw new Error(`HTTP ${res.status} when downloading model`);

    const arrayBuf = await res.arrayBuffer();
    await fs.promises.writeFile(destPath, Buffer.from(arrayBuf));

    return {
      ok: true,
      alreadyExists: false,
      path: destPath,
      message: `Downloaded model to ${destPath}`,
    };
  } catch (err: any) {
    console.error("download-model error:", err);
    return { ok: false, error: err?.message || String(err) };
  }
});

// ---------- File / Workspace IPC ----------

type TreeNode = {
  type: "file" | "dir";
  name: string;
  fullPath: string;
  children?: TreeNode[];
};

function buildTree(root: string): TreeNode {
  const stats = fs.statSync(root);
  const node: TreeNode = {
    type: stats.isDirectory() ? "dir" : "file",
    name: path.basename(root),
    fullPath: root,
  };

  if (stats.isDirectory()) {
    const entries = fs.readdirSync(root);
    node.children = entries
      .filter((e) => !e.startsWith(".") && e !== "node_modules")
      .map((e) => buildTree(path.join(root, e)));
  }

  return node;
}

ipcMain.handle("open-folder", async () => {
  const res = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (res.canceled || !res.filePaths[0]) return { ok: false, canceled: true };

  const root = res.filePaths[0];
  try {
    const tree = buildTree(root);
    return { ok: true, root, tree };
  } catch (err: any) {
    console.error("open-folder error:", err);
    return { ok: false, error: err?.message || String(err) };
  }
});

ipcMain.handle("read-file", async (_e, filePath: string) => {
  try {
    const text = await fs.promises.readFile(filePath, "utf8");
    return { ok: true, text };
  } catch (err: any) {
    console.error("read-file error:", err);
    return { ok: false, error: err?.message || String(err) };
  }
});

ipcMain.handle(
  "write-file",
  async (_e, filePath: string, contents: string) => {
    try {
      await fs.promises.writeFile(filePath, contents, "utf8");
      return { ok: true };
    } catch (err: any) {
      console.error("write-file error:", err);
      return { ok: false, error: err?.message || String(err) };
    }
  }
);

ipcMain.handle("new-file", async (_e, dirPath: string, name: string) => {
  try {
    const target = path.join(dirPath, name);
    await fs.promises.writeFile(target, "", { flag: "wx" }); // fail if exists
    const tree = buildTree(dirPath);
    return { ok: true, fullPath: target, tree };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
});

ipcMain.handle("new-folder", async (_e, dirPath: string, name: string) => {
  try {
    const target = path.join(dirPath, name);
    await fs.promises.mkdir(target, { recursive: false });
    const tree = buildTree(dirPath);
    return { ok: true, fullPath: target, tree };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
});

ipcMain.handle("delete-entry", async (_e, fullPath: string) => {
  try {
    const stats = await fs.promises.stat(fullPath);
    if (stats.isDirectory()) {
      await fs.promises.rm(fullPath, { recursive: true, force: true });
    } else {
      await fs.promises.unlink(fullPath);
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
});

ipcMain.handle("set-active-model", async (_e, fileName: string) => {
  global.activeModelPath = path.join(process.cwd(), "runtime", "models", fileName);
  console.log("Active model set to:", global.activeModelPath);
  return { ok: true };
});


ipcMain.handle(
  "rename-entry",
  async (_e, oldPath: string, newPath: string) => {
    try {
      await fs.promises.rename(oldPath, newPath);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || String(err) };
    }
  }
);

// ---------- App lifecycle ----------

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
