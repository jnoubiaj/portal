// Railway entry point — runs GHL proxy + daily scheduler in one process
// Start: node worker.mjs
// Env vars: PORT (Railway assigns), GHL_API_KEY, GHL_LOCATION_ID, EMAIL_PASS

// Tell scheduler which port the GHL proxy is on (same process, same PORT)
process.env.GHL_PROXY_PORT = process.env.PORT || '3001';

console.log('[Worker] Starting CapitalQuest services…');
console.log('[Worker] GHL proxy port:', process.env.GHL_PROXY_PORT);
console.log('[Worker] Time:', new Date().toISOString());

// Start GHL proxy HTTP server (must come first — scheduler may call it at cron time)
await import('./ghl-server.mjs');

// Small delay so the HTTP server finishes binding before scheduler logs start
await new Promise(r => setTimeout(r, 500));

// Start daily scheduler (registers cron jobs — fires at scheduled times)
await import('./scheduler.mjs');

console.log('[Worker] All services running. Waiting for scheduled events…');
