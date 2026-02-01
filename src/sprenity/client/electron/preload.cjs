const { contextBridge } = require('electron');

// Expose any APIs to the renderer process here
// For now, we just set up the secure context bridge for future native features
contextBridge.exposeInMainWorld('electronAPI', {
  // Add native features here as needed, for example:
  // platform: process.platform,
});
