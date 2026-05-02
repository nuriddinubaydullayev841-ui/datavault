// app.js — DataVault Main Logic
// Covers: SW registration, install prompt, online/offline status

'use strict';

// ─── 1. Service Worker Registration ──────────────────────────────────────────
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[App] Service Workers are not supported in this browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      // updateViaCache: 'none' forces the browser to always hit the
      // network for the SW script itself, ensuring updates are never
      // served from the HTTP cache.
      updateViaCache: 'none',
    });

    console.log('[App] ✅ Service Worker registered. Scope:', registration.scope);

    // Detect when a new SW is waiting and prompt the user to update
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[App] 🔄 New Service Worker installing…');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[App] 🆕 New version available. Prompting user…');
          showUpdateBanner();
        }
      });
    });

    // Reload the page once the new SW has taken control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

  } catch (error) {
    console.error('[App] ❌ Service Worker registration failed:', error);
  }
};

// ─── 2. Install Prompt (Add to Home Screen) ───────────────────────────────────
let deferredInstallPrompt = null;

// Capture the browser's install prompt event before it fires
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault(); // Prevent the mini-infobar from appearing on mobile
  deferredInstallPrompt = event;
  console.log('[App] 📲 beforeinstallprompt captured — showing install button.');
  showInstallButton();
});

// Call this when the user clicks your custom install button
const handleInstallClick = async () => {
  if (!deferredInstallPrompt) {
    console.warn('[App] No install prompt available.');
    return;
  }

  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;

  if (outcome === 'accepted') {
    console.log('[App] ✅ User accepted the install prompt.');
  } else {
    console.log('[App] ❌ User dismissed the install prompt.');
  }

  // The prompt can only be used once — discard it
  deferredInstallPrompt = null;
  hideInstallButton();
};

window.addEventListener('appinstalled', () => {
  console.log('[App] 🎉 DataVault was installed successfully.');
  deferredInstallPrompt = null;
  hideInstallButton();
});

// ─── 3. Online / Offline Status ──────────────────────────────────────────────
const updateOnlineStatus = () => {
  const isOnline = navigator.onLine;
  const statusEl = document.getElementById('connection-status');

  if (!statusEl) return;

  if (isOnline) {
    statusEl.textContent = '🟢 Online';
    statusEl.className = 'status-online';
    console.log('[App] 🌐 Connection restored.');
  } else {
    statusEl.textContent = '🔴 Offline — using cached data';
    statusEl.className = 'status-offline';
    console.log('[App] 📴 Connection lost — switching to cache.');
  }
};

window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ─── 4. Update Banner (new SW waiting) ───────────────────────────────────────
const showUpdateBanner = () => {
  const banner = document.getElementById('update-banner');
  if (banner) banner.hidden = false;
};

const handleUpdateClick = () => {
  if (!navigator.serviceWorker.controller) return;
  // Tell the waiting SW to skip waiting and activate
  navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
};

// ─── 5. Install Button UI helpers ────────────────────────────────────────────
const showInstallButton = () => {
  const btn = document.getElementById('install-btn');
  if (btn) btn.hidden = false;
};

const hideInstallButton = () => {
  const btn = document.getElementById('install-btn');
  if (btn) btn.hidden = true;
};

// ─── 6. DOM wiring — run after DOM is ready ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Initial status check
  updateOnlineStatus();

  // Wire up install button
  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.addEventListener('click', handleInstallClick);
  }

  // Wire up update banner button
  const updateBtn = document.getElementById('update-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', handleUpdateClick);
  }

  // Wire up optional cache-clear button
  const clearBtn = document.getElementById('clear-cache-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
        console.log('[App] 🗑️ Cache clear requested.');
      }
    });
  }

  // Register the Service Worker
  registerServiceWorker();
});
