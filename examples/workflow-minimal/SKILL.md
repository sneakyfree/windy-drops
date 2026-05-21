---
schema: windy.drop.v1
id: your-handle-my-workflow
name: My Workflow
subtitle: A starter multi-step workflow
type: workflow
version: 0.1.0
author:
  - name: Your Name
license: MIT
tags:
  - starter
---

# My Workflow

A starter workflow scaffolded by `windy-drops new --type workflow`.

Workflows ship a multi-step recipe the workflow-runner executes on a trigger (cron, webhook, manual). Replace this body with the trigger spec + the steps.

```yaml
# Add a workflow section to SKILL.md frontmatter:
workflow:
  trigger:
    type: cron
    schedule: "0 7 * * *"           # 7am daily
  steps:
    - id: fetch_email
      tool: gmail.list_unread
      params: { since: "1h" }
    - id: summarize
      tool: mind.completion
      params: { input: "{{steps.fetch_email.output}}" }
```
