---
schema: windy.drop.v1
id: your-handle-my-dashboard
name: My Dashboard
subtitle: A starter Control Panel template
type: control-panel-template
version: 0.1.0
author:
  - name: Your Name
license: MIT
consumes:
  - windy.vitals.v1
  - windy.fleet.v1
surfaces:
  - windy-control-panel
entry: render.js
tags:
  - starter
preview: preview.png
control_panel:
  refresh_interval_ms: 5000
  supports_remote_fleet: true
---

# My Dashboard

A starter Control Panel template scaffolded by `windy-drops new --type control-panel-template`.

The renderer entry point is `render.js`. It receives a Vitals payload and a Fleet payload via `postMessage` from the host. Update the body of `render(vitals, fleet)` in `render.js` to build your dashboard.

## Develop locally

```bash
windy-drops validate .
windy-drops bundle .
# Preview in the windy-drops site sandbox at https://windydrops.com/d/<id>/preview after publish
```

## Publish

```bash
windy-drops publish .
```

See `https://windydrops.com/docs/authoring-guide` for the full author guide.
