// Simple smoke test script to validate the backend endpoints.
// Runs with: node server/smoke.js
const base = process.env.BASE_URL || 'http://localhost:5000';

async function fetchJson(path) {
  const url = `${base}${path}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`${path} returned ${res.status} ${res.statusText}`);
  }
  return res.json();
}

(async () => {
  try {
    console.log('Checking', `${base}/health`);
    const health = await fetchJson('/health');
    console.log('Health:', health.status || 'unknown', 'uptime:', health.uptimeSeconds);

    if (health.status !== 'ok') {
      throw new Error('Health check did not return ok');
    }

    console.log('Checking /api/deployments');
    const deployments = await fetchJson('/api/deployments');
    if (!Array.isArray(deployments)) throw new Error('/api/deployments did not return an array');
    console.log('Deployments count:', deployments.length);

    console.log('Checking /api/traffic-split');
    const split = await fetchJson('/api/traffic-split');
    if (typeof split.blue !== 'number' || typeof split.green !== 'number') throw new Error('/api/traffic-split invalid response');
    console.log('Traffic split:', split);

    console.log('Smoke tests passed');
    process.exit(0);
  } catch (err) {
    console.error('Smoke test failed:', err?.message || err);
    process.exit(2);
  }
})();
