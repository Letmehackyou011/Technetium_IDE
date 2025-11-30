// apps/electron-ui/src/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

const isDev = process.env.NODE_ENV !== 'production';
let mainWindow: BrowserWindow | null = null;
let modelProc: any = null; // pid/process handle for spawned model runner

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // On Windows quit when all windows closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers

ipcMain.handle('ping', async () => 'pong');

// download-model: spawn the Node downloader script and stream its output back when done
ipcMain.handle('download-model', async (_ev, url: string, sha?: string) => {
  return new Promise<string>((resolve, reject) => {
    try {
      // script path relative to dist/main.js when built, or relative to src when running dev with ts-node/esbuild
      // __dirname points to compiled /dist folder in production. We compute path that also works in dev if running compiled.
      const repoRoot = path.resolve(__dirname, '..', '..'); // apps/electron-ui/dist/.. -> apps/electron-ui -> repo root relative
      const scriptPathCandidate1 = path.join(repoRoot, 'scripts', 'download-and-verify.js');
      const scriptPath = fs.existsSync(scriptPathCandidate1) ? scriptPathCandidate1 : path.join(__dirname, '..', '..', 'scripts', 'download-and-verify.js');

      const nodeExe = process.execPath; // node executable path
      const args = [scriptPath, url, sha || ''];

      const proc = spawn(nodeExe, args, { stdio: ['ignore', 'pipe', 'pipe'] });

      let out = '';
      proc.stdout.on('data', (chunk) => {
        out += chunk.toString();
      });
      proc.stderr.on('data', (chunk) => {
        out += chunk.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) resolve(out);
        else reject(new Error(`Downloader exited with code ${code}\n${out}`));
      });

      proc.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
});

// model-health: try to fetch /health on local model runner
ipcMain.handle('model-health', async () => {
  try {
    const res = await fetch('http://127.0.0.1:11434/health', { method: 'GET' });
    const json = await res.json();
    return { ok: true, data: json };
  } catch (e: any) {
    return { ok: false, error: String(e) };
  }
});

// start-model: spawn the services/model-runner/index.js (mock or real runner) as a detached child
ipcMain.handle('start-model', async () => {
  if (modelProc) return { started: false, reason: 'already running' };

  try {
    const repoRoot = path.resolve(__dirname, '..', '..');
    const runnerCandidate = path.join(repoRoot, 'services', 'model-runner', 'index.js');
    const runnerPath = fs.existsSync(runnerCandidate) ? runnerCandidate : path.join(__dirname, '..', '..', 'services', 'model-runner', 'index.js');

    const nodeExe = process.execPath;
    // spawn detached so it keeps running if main process restarts (for dev it's fine)
    modelProc = spawn(nodeExe, [runnerPath], {
      detached: true,
      stdio: 'ignore',
    });
    modelProc.unref();

    return { started: true, pid: modelProc.pid };
  } catch (e: any) {
    return { started: false, error: String(e) };
  }
});

// stop-model: kill the spawned process if present
ipcMain.handle('stop-model', async () => {
  if (!modelProc) return { stopped: false, reason: 'not running' };
  try {
    process.kill(modelProc.pid);
    modelProc = null;
    return { stopped: true };
  } catch (e: any) {
    return { stopped: false, error: String(e) };
  }
});