import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";

async function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(error => error ? reject(error) : resolve(port));
    });
  });
}

test("backend serves health and frontend and rejects invalid images", async t => {
  const port = await freePort();
  const child = spawn(process.execPath, ["server.js"], {
    env: { ...process.env, PORT: String(port), OPENAI_API_KEY: "", FRONTEND_ORIGIN: "" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(() => { if (child.exitCode === null) child.kill("SIGTERM"); });

  const base = `http://127.0.0.1:${port}`;
  let health;
  for (let attempt = 0; attempt < 50; attempt++) {
    if (child.exitCode !== null) throw new Error(`Backend exited early: ${logs}`);
    try { health = await fetch(`${base}/api/health`); break; }
    catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  assert.ok(health, `Backend did not start. Logs: ${logs}`);
  assert.equal(health.status, 200);
  const status = await health.json();
  assert.equal(status.status, "ok");
  assert.equal(status.apiKeyConfigured, false);

  const home = await fetch(base);
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, /backend-api-url/);
  assert.doesNotMatch(html, /Accident Description \(Optional\)/);

  const invalid = await fetch(`${base}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: "not-an-image" })
  });
  assert.equal(invalid.status, 400);
  assert.match((await invalid.json()).error, /valid JPG, PNG, or WEBP/i);
});
