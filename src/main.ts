import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { BootManager, BootEntry } from './bootManager';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    resizable: false,
    transparent: false,
    backgroundColor: '#0078d7',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, '../assets/icon.ico')
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 开发模式下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // 检查管理员权限
  const isAdmin = await BootManager.isAdmin();

  if (!isAdmin) {
    const { dialog } = require('electron');
    dialog.showErrorBox(
      '权限不足',
      '此应用需要以管理员身份运行才能切换系统。\n请右键点击程序，选择"以管理员身份运行"。'
    );
    app.quit();
    return;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 通信处理
ipcMain.handle('get-boot-entries', async (): Promise<BootEntry[]> => {
  try {
    return await BootManager.getBootEntries();
  } catch (error) {
    console.error('获取启动项失败:', error);
    throw error;
  }
});

ipcMain.handle('get-current-default', async (): Promise<string> => {
  try {
    return await BootManager.getCurrentDefault();
  } catch (error) {
    console.error('获取默认启动项失败:', error);
    throw error;
  }
});

ipcMain.handle('switch-system', async (_event, identifier: string): Promise<void> => {
  try {
    await BootManager.switchToSystem(identifier);
  } catch (error) {
    console.error('切换系统失败:', error);
    throw error;
  }
});

ipcMain.handle('close-app', () => {
  app.quit();
});
