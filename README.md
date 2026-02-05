# Nexus
Nexus is a next-generation smart intercom system that transforms every room into a connected hub. Going beyond simple voice commands, it integrates high-definition video calling with a robust internal phone extension network. 
Whether you are calling the kitchen from the garage or routing an external call to a specific bedroom, Nexus offers granular control with personalized profiles and custom ringtones for every zone in your house.

# Structure
/nexus
├── /apps
│   ├── /web                  # Browser Client (Vite + React)
│   │   ├── /src
│   │   │   ├── App.tsx       # Web-specific layout
│   │   │   └── main.tsx
│   │   └── package.json
│   │
│   ├── /desktop              # Electron Client
│   │   ├── /electron         # Main Process (Node/Bun logic for OS)
│   │   │   ├── main.ts       # Window creation, Tray icons
│   │   │   └── preload.ts    # Bridge between OS and React
│   │   ├── /src              # Renderer Process (React - looks like /web)
│   │   │   └── App.tsx       # Desktop-specific layout (e.g., no browser chrome)
│   │   ├── electron-builder.json
│   │   └── package.json
│   │
│   └── /api                  # Backend (Bun Native)
│       ├── /src
│       │   ├── index.ts      # Bun.serve() or ElysiaJS entry
│       │   ├── /handlers     # WebSocket handlers (signaling)
│       │   ├── /db           # SQLite/Postgres (Bun:sqlite is great)
│       │   └── /routes       # HTTP Routes
│       └── package.json
│
├── /packages                 # Shared Code (The "Glue")
│   │
│   ├── /shared-types         # API & Signaling Interfaces
│   │   ├── index.ts
│   │   └── package.json
│   │
│   ├── /ui-kit               # Visuals (Buttons, VideoContainer, Dialpad)
│   │   ├── /components
│   │   └── package.json
│   │
│   └── /client-core          # LOGIC (Hooks, State, WebRTC)
│       ├── /hooks
│       │   ├── useWebRTC.ts  # The heavy lifting for connections
│       │   └── useSignaling.ts
│       ├── /contexts
│       │   └── CallProvider.tsx # Global call state
│       └── package.json
│
├── /infrastructure           # Docker & Deployment
├── package.json              # Workspaces config
├── turbo.json                # Turborepo config (Recommended)
└── README.md