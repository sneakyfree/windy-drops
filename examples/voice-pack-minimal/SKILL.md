---
schema: windy.drop.v1
id: your-handle-my-voice
name: My Voice
subtitle: A starter voice pack
type: voice-pack
version: 0.1.0
author:
  - name: Your Name
license: CC-BY-NC-4.0
surfaces:
  - windy-clone
tags:
  - starter
---

# My Voice

A starter voice pack scaffolded by `windy-drops new --type voice-pack`.

Voice packs ship a synthesis profile (provider id + voice id + style parameters) that Windy Clone consumes. Replace the placeholder fields below with your provider's identifiers.

```yaml
# Add a voice_pack section to SKILL.md frontmatter with your provider's profile:
voice_pack:
  provider: elevenlabs              # elevenlabs | heygen | windy-native (future)
  voice_id: PLACEHOLDER             # provider-issued voice id
  style:
    stability: 0.5
    similarity_boost: 0.75
```
