// @ts-nocheck
import * as fs from 'fs'
import * as path from 'path'

import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import readXlsxFile, { readSheetNames } from 'read-excel-file/node'
import sqlite3, { cached } from 'sqlite3'
import icon from '../../resources/icon.png?asset'
import { AirEnvironmentExcelSchema, LocationInfoExcelSchema, OcenSedimentExcelSchema } from './schema'
import { AirEnvironmentThreshold } from './define'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders;
    headers['Cross-Origin-Embedder-Policy'] = ['require-corp'];
    headers['Cross-Origin-Opener-Policy'] = ['same-origin'];
    callback({ cancel: false, responseHeaders: headers });
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }


  ipcMain.on('crop-data', (event, arg) => {
    // event.reply('selected-folder-data', getTableData(arg))
    // const files = fs.readdirSync(getTableData(arg))
    const value = JSON.parse(arg)
    const folderPath = value.folderPath
    const vref = 2.5
    const pga = 1
    const startTime = value.startTime
    const cuttingTime = value.cuttingTime
    const removeNumber = value.removeNumber
    const cuttingStartTimeDecimal = value.startTimeDecimal
    const isSuccess = processDataFile(
      folderPath,
      vref,
      pga,
      startTime,
      cuttingTime,
      removeNumber,
      cuttingStartTimeDecimal,
    )
    if (isSuccess) {
      event.reply('crop-data-success', isSuccess)
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

app.on('window-all-closed', () => {
  app.quit()
})
