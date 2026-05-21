// render.js — Control Panel template entry point.
//
// The host (Web SPA or Electron renderer) loads this file inside a sandboxed
// iframe and calls render() each time fresh Vitals + Fleet data arrives.
//
// Vitals shape: windy.vitals.v1 (CPU, GPU, memory, disk, network, ...)
// Fleet shape : windy.fleet.v1  (this_machine + agents[])

export function render(vitals, fleet) {
  const root = document.getElementById("root");
  if (!root) return;

  root.innerHTML = `
    <h1>${escape(vitals.host.hostname)}</h1>
    <p>CPU avg: ${vitals.cpu.avg_utilization_pct.toFixed(1)}%</p>
    <p>Memory used: ${vitals.memory.used_pct.toFixed(1)}%</p>
    <p>Agents online: ${fleet.agents.filter((a) => a.status === "online").length}</p>
  `;
}

function escape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
