---
schema: windy.drop.v1
id: your-handle-my-skill
name: My Skill
subtitle: A starter agent skill
type: skill
version: 0.1.0
author:
  - name: Your Name
license: MIT
surfaces:
  - windy-fly
tags:
  - starter
---

# My Skill

A starter agent skill scaffolded by `windy-drops new --type skill`.

When installed, agents on `surfaces: windy-fly` (Windy Fly) can invoke this skill.

Replace this body with the skill's instructions. The whole markdown body is the prompt the agent loads at invocation time — write it for the agent, not for a human reader.

## Example

> When the user asks about apartments in NYC, search StreetEasy for matching listings, summarize the top 3, and offer to set a daily alert.
