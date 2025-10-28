# Demo Buddy - Product Vision & Persona

**Last Updated**: October 27, 2025
**Status**: MVP Development (72-hour sprint)

---

## Executive Summary

Demo Buddy is a **developer-focused desktop video editor** designed for recording and editing technical demos, tutorials, and product walkthroughs. Positioned as the "VSCode of video editors," it prioritizes speed, keyboard shortcuts, and developer-specific features while remaining free and open source.

**Core Value Proposition**: Fast, simple video editing for developers who need to create technical content without the complexity of professional NLE software or the limitations of consumer tools like Loom.

---

## Target Persona: "Demo Dave"

### Profile
- **Role**: Senior Software Developer / DevRel / Product Manager
- **Age**: 28-40
- **Tech Stack**: Full-stack developer, comfortable with command line
- **Use Cases**:
  - Recording product demos for sales/marketing
  - Creating technical tutorials for documentation
  - Bug reports with video reproduction steps
  - Feature walkthroughs for stakeholders
  - Conference talk recordings and editing

### Pain Points
1. **Loom is too simple**: No timeline editing, can't make precise cuts, limited export options
2. **Camtasia/ScreenFlow are too complex**: Overwhelming UI, expensive subscriptions, overkill for simple demos
3. **Needs quick turnaround**: Record → trim mistakes → export → share in under 5 minutes
4. **Values efficiency**: Prefers keyboard shortcuts over mouse clicking
5. **Privacy concerns**: Doesn't want cloud uploads, wants local control of files
6. **Open source preference**: Wants to avoid vendor lock-in and subscription fatigue

### Goals
- ✅ Record a clean demo without mistakes showing
- ✅ Quickly trim out "um"s, pauses, and errors
- ✅ Export in formats ready for Twitter, YouTube, Slack
- ✅ Work offline without cloud dependencies
- ✅ Maintain full quality without compression artifacts

---

## Product Strategy

### Positioning: "VSCode of Video Editors"
- **Fast & Keyboard-Driven**: Every action has a shortcut
- **Developer-Focused**: Features designed for technical content
- **Clean & Efficient**: Minimal chrome, maximum workspace
- **Free & Open Source**: No subscriptions, community-driven

### Competitive Differentiation

| Feature | Loom | Camtasia | ScreenFlow | ClipForge |
|---------|------|----------|------------|-----------|
| Price | Free tier / $12.50/mo | $300 one-time | $169 one-time | **Free (OSS)** |
| Timeline Editing | ❌ | ✅ | ✅ | ✅ |
| Keyboard Shortcuts | Limited | ✅ | ✅ | **✅ Optimized** |
| Keystroke Display | ❌ | ✅ (plugin) | ✅ (plugin) | **✅ Built-in** |
| Cloud Upload Required | ✅ | ❌ | ❌ | **❌** |
| Code Syntax Highlighting | ❌ | ❌ | ❌ | **✅ Planned** |
| Terminal Recording | ❌ | ❌ | ❌ | **✅ Planned** |
| Learning Curve | Low | High | Medium | **Medium-Low** |

**Key Differentiators**:
1. ⚡ **Speed/Simplicity**: Faster than pro tools, more powerful than Loom
2. 👨‍💻 **Developer-Focused**: Code highlighting, terminal recording, keystroke display
3. 🔒 **Privacy/Local-First**: Everything on your machine, no cloud uploads
4. 🆓 **Free/Open Source**: No subscriptions, community extensibility

---

## User Workflows

### Workflow 1: Record First, Edit Later (Primary)
1. Open ClipForge → Click Record button
2. Record screen/webcam demo (with live markers for good/bad sections)
3. Stop recording → automatically loads into timeline
4. Scrub through timeline, cut out mistakes
5. Export with preset (Twitter 2:20, YouTube, etc.)
6. Share file directly via Slack/Discord

**Time Target**: 3-5 minutes from recording to shareable video

### Workflow 2: Quick Edits to Existing Videos
1. Drag video file into ClipForge
2. Set in/out points on timeline
3. Export trimmed version
4. Done

**Time Target**: Under 2 minutes

### Workflow 3: Live Recording with Real-Time Editing (Advanced)
1. Start recording with live marker feature enabled
2. Press hotkey during recording to mark "good take" sections
3. Press different hotkey to mark "cut this out" sections
4. Stop recording → ClipForge auto-applies markers to timeline
5. Review and fine-tune cuts
6. Export

**Time Target**: Minimal post-processing needed

---

## Feature Roadmap

### MVP (High Priority - Complete by Oct 28, 2025)
- [x] Basic video import (drag & drop, file picker)
- [x] Timeline view with scrubbing
- [x] Video preview player with controls
- [ ] Trim/split/delete functionality
- [ ] Keyboard shortcuts (Space, I/O, Delete, Cmd+K)
- [ ] Export with presets (MP4 quality options)

### Phase 2 (Medium Priority - Developer Differentiators)
- [ ] Screen/webcam recording integration
- [ ] Keystroke display overlay
- [ ] Mouse click indicators
- [ ] Zoom/pan controls
- [ ] Live recording markers
- [ ] Silence detection & auto-remove

### Phase 3 (Low Priority - Advanced Features)
- [ ] Multi-track timeline (picture-in-picture)
- [ ] Text overlays & arrows
- [ ] Terminal recording with searchable text
- [ ] Code syntax highlighting snippets
- [ ] Filler word detection (AI-powered)
- [ ] Batch export
- [ ] Project templates

### Future Ideas (Nice-to-Haves)
- [ ] GitHub integration ("Create video for this PR")
- [ ] Clipboard monitoring (auto-import screenshots)
- [ ] Export to GIF
- [ ] Optional CDN upload with shareable links
- [ ] Plugin system for community extensions

---

## Design Decisions

### Layout Philosophy
**Maximize editing workspace while keeping tools accessible**

#### Current Layout (v1.1)
```
┌─────────────────────────────────────────────┬────────┐
│                                             │ Sidebar│
│     Large Video Player                      │ (300px)│
│     (Full width when sidebar collapsed)     │        │
│                                             │ Upload │
│                                             │ Videos │
├─────────────────────────────────────────────┤ List   │
│          Timeline (Full Width)              │        │
│  [====■══════════════════════════]          │        │
└─────────────────────────────────────────────┴────────┘
```

**Key Principles**:
1. **Big video preview** - Critical for detailed editing work and future overlay tools
2. **Sidebar collapses** - Gives even more room when needed
3. **Timeline at bottom** - Professional NLE standard, intuitive for scrubbing
4. **Upload gets out of the way** - Big initial upload, compact mode after videos loaded
5. **Minimal chrome** - Clean interface without excessive buttons/panels

### Color Scheme & Branding
- **Primary**: Purple gradient (#667eea → #764ba2)
- **Accent**: Purple for interactive elements
- **Background**: Light mode with subtle gradients
- **Vibe**: Professional but friendly, modern without being trendy

### Keyboard Shortcuts (Standard NLE Conventions)
| Key | Action | Why |
|-----|--------|-----|
| `Space` | Play/Pause | Universal standard |
| `I` | Mark In Point | Premiere/Final Cut convention |
| `O` | Mark Out Point | Premiere/Final Cut convention |
| `Delete` | Delete Selection | Obvious |
| `Cmd+K` | Split at Playhead | Premiere standard |
| `J/K/L` | Rewind/Pause/Forward | Pro editor muscle memory |
| `[/]` | Frame Back/Forward | Precision editing |
| `Cmd+R` | Start Recording | Quick access |
| `Cmd+E` | Export | Standard save-as pattern |
| `Cmd+Z/Shift+Z` | Undo/Redo | Standard |

---

## Technical Stack

### Current Implementation
- **Framework**: Electron + React
- **Build Tool**: Vite (fast hot-reload)
- **Styling**: Plain CSS (no framework - keeps bundle small)
- **Video Protocol**: Custom `media://` protocol for secure local file access
- **State Management**: React hooks (useState) - simple for now

### Future Considerations
- **Video Processing**: FFmpeg integration for export/effects
- **Timeline Engine**: Canvas-based for performance (Fabric.js or Konva.js)
- **Recording**: Electron `desktopCapturer` API
- **AI Features**: Optional ONNX.js for client-side ML (filler word detection)

---

## Success Metrics

### MVP Success (Oct 29, 2025)
- [ ] Can import a video
- [ ] Can scrub through timeline
- [ ] Can trim start/end
- [ ] Can export MP4
- [ ] Demo works smoothly in front of audience
- [ ] Packaged as standalone app (.app for Mac)

### Product-Market Fit Indicators (3 months)
- 1,000+ GitHub stars
- 50+ community contributions
- 100+ weekly active users
- Positive mentions on Twitter/HN
- Feature requests that align with developer needs

### Long-Term Vision (1 year)
- 10,000+ users
- Plugin ecosystem emerging
- Referenced as "the developer's video editor"
- Community maintaining feature development
- Used by major dev tools companies for demos

---

## User Feedback & Iteration Plan

### How We'll Gather Feedback
1. **GitHub Issues**: Primary channel for feature requests
2. **Twitter**: Monitor #ClipForge hashtag
3. **Dev Communities**: Share on HackerNews, r/programming
4. **Usage Analytics**: Optional, privacy-preserving telemetry
5. **Direct Outreach**: Interview early adopters

### Iteration Cadence
- **Weekly releases** during MVP phase
- **Bi-weekly releases** after v1.0
- **Major versions** quarterly
- **Community input** via RFC process for big changes

---

## Open Questions & Decisions Needed

### Design
- [ ] Dark mode support? (Many developers prefer dark mode)
- [ ] Custom themes/plugin system?
- [ ] Window size persistence?

### Features
- [ ] Multi-language support? (Start with English only?)
- [ ] AI features require internet? (Privacy tradeoff)
- [ ] Max video resolution? (4K support?)

### Distribution
- [ ] Auto-update mechanism?
- [ ] Homebrew formula?
- [ ] Windows/Linux support timeline?
- [ ] Code signing for macOS?

---

## Appendix: User Research Quotes

> "I just need Loom with a timeline. That's literally it."
> — Frontend developer, YC startup

> "Camtasia is like using Photoshop to crop a screenshot."
> — DevRel engineer, Enterprise SaaS

> "I record demos 3-4x per week. Every minute saved in editing adds up."
> — Product Manager, B2B startup

> "I want my video editing tool to feel like my code editor - fast, keyboard-driven, extensible."
> — Open source maintainer

---

## Contact & Contributions

**Project Lead**: [Your Name]
**GitHub**: [Repository URL]
**Twitter**: [@ClipForge]
**Discord**: [Community Server]

**Contributing**: See CONTRIBUTING.md for guidelines. We welcome:
- Bug reports and fixes
- Feature implementations
- Documentation improvements
- UI/UX design suggestions
- Developer-focused plugins

---

*This document is a living artifact. Update as we learn more about our users and iterate on the product.*
