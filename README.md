<div align="center">

# Skeleton Studio

### Visual gesture automation builder

[![Electron](https://img.shields.io/badge/Electron-41-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

> **Build gesture-powered automations with a drag-and-drop flow editor. Point your webcam, map hand gestures to actions, and control your Mac hands-free.**

<br>

Built on top of [Skeleton Engine](https://github.com/L-ubu/Skaleton_Comand) (MediaPipe hand tracking + OpenCV).

</div>

---

## Features

- **Flow Editor** — Drag-and-drop chains: connect gesture triggers to action blocks (keypress, mouse click, shell command, macro)
- **Live Camera Feed** — Real-time hand skeleton overlay with gesture detection and confidence tracking
- **Skeleton-Only Mode** — Black out the camera feed, show only the hand skeleton (`S` key)
- **Mouse Mode** — Control your cursor with hand tracking (`M` key)
- **Global Hotkey** — Toggle gesture recognition system-wide with `Cmd+Shift+G`
- **Block Palette** — Categorized library of triggers and actions to build your automation chains
- **Properties Panel** — Configure each block's settings (key bindings, commands, thresholds)
- **Multiple Layouts** — Switch between Scratch, Split, and Canvas views
- **Save/Load Projects** — Export and import your gesture configurations
- **Live Config Sync** — Changes in the UI push instantly to the running engine

## Architecture

```
┌─────────────────────────────────────┐
│         Electron Main Process       │
│  ┌──────────┐    ┌───────────────┐  │
│  │  engine.ts│◄──►│  WebSocket    │  │
│  │  (spawn)  │    │  Server :9150 │  │
│  └──────────┘    └───────┬───────┘  │
│                          │          │
│  ┌───────────────────────▼───────┐  │
│  │      Python Engine Process    │  │
│  │  MediaPipe + OpenCV + Bridge  │  │
│  │  (camera, tracking, actions)  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │     React UI (Renderer)       │  │
│  │  Flow Editor + Block Palette  │  │
│  │  Properties + Webcam Viewer   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+ with a virtual environment in `engine/.venv`
- **macOS** (camera access + accessibility permissions for mouse/keyboard control)

### Install

```bash
git clone https://github.com/L-ubu/Skeleton_Studio.git
cd Skeleton_Studio
npm install
```

The Python engine lives in `engine/` — set up its virtualenv:

```bash
cd engine
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Run

```bash
npm run dev
```

This starts Vite (React UI) and the Electron process concurrently. The Python engine launches automatically when you hit Start in the app.

### Build

```bash
npm run build
```

Produces a `.app` bundle in `release/` with the Python engine bundled as an extra resource.

## Camera Controls

| Key | Action |
|-----|--------|
| `S` | Toggle skeleton-only mode (black background) |
| `M` | Toggle mouse control mode |
| `Q` | Quit camera window |
| `Cmd+Shift+G` | Global hotkey: enable/disable gesture recognition |

## Tech Stack

| Layer | Tech |
|-------|------|
| Desktop | Electron 41 |
| UI | React 19 + TypeScript + Tailwind CSS 4 |
| State | Zustand |
| Drag & Drop | @dnd-kit/core |
| Build | Vite 8 + electron-builder |
| Engine | Python 3.11 + MediaPipe + OpenCV |
| IPC | WebSocket (ws) on port 9150 |

## License

[MIT](LICENSE)
