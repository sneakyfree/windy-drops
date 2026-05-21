---
schema: windy.drop.v1
id: your-handle-my-tool
name: My Tool
subtitle: A starter MCP-style tool
type: tool
version: 0.1.0
author:
  - name: Your Name
license: MIT
tags:
  - starter
---

# My Tool

A starter MCP-style tool scaffolded by `windy-drops new --type tool`.

Tools wrap a single function the agent can invoke. Replace this body with:

- A one-sentence description of what the tool does
- The input parameters (name + type + meaning)
- The return shape
- Example invocations

The agent loader reads this manifest at install time and registers the tool with its capability layer.
