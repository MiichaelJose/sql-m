# SQL Monitor (sql-m) - Project Specification

## 1. Project Overview
**SQL Monitor (sql-m)** is a high-performance desktop application designed for real-time SQL traffic analysis and performance monitoring. By leveraging a low-latency gRPC ingestion pipeline, it provides developers and DBAs with instant visibility into query execution patterns, identifies bottlenecks, and helps optimize database performance.

## 2. Goals and Objectives
*   **Low Latency Monitoring**: Capture and display SQL queries with minimal delay using gRPC.
*   **Actionable Insights**: Automatically detect and highlight "slow queries" based on configurable thresholds.
*   **Premium User Experience**: Provide a modern, responsive, and visually stunning interface for complex data visualization.
*   **Cross-Platform Availability**: Support Windows, macOS, and Linux via Electron.

## 3. Architecture
The application follows a tiered architecture to ensure separation of concerns and high performance:

*   **Frontend (React)**: A highly interactive UI built with React, focusing on real-time data streaming and complex filtering.
*   **App Shell (Electron)**: Manages the desktop window lifecycle and provides native system access.
*   **Backend Services (Node.js)**: Runs within the Electron Main process. It hosts the gRPC server that receives data from external probes.
*   **Data Ingestion (gRPC)**: A Protocol Buffers-based service that allows high-throughput, structured data transfer from `sql-tapd`.

## 4. Data Flow
1.  **sql-tapd**: An external probe or sensor captures raw network/database traffic.
2.  **gRPC Ingestion**: The probe sends serialized Protobuf messages to the SQL Monitor backend via gRPC.
3.  **Processing Layer**: Node.js receives the data, applies initial filters, and formats it for the UI.
4.  **IPC Bridge**: Data is passed from the Electron Main process to the Renderer process via Inter-Process Communication (IPC).
5.  **UI Rendering**: React efficiently updates the query grid and metrics charts using the incoming stream.

## 5. Key Features
*   **Real-time Query Stream**: A live, auto-scrolling view of all SQL statements being executed.
*   **Slow Query Detection**: Visual alerts and dedicated views for queries exceeding defined execution time limits.
*   **Advanced Filtering**: Powerful search and filter capabilities (by DB Name, User, Query Type, or Regex patterns).
*   **Query Inspector**: Detailed view for individual queries, showing full SQL syntax, parameters, and metadata.
*   **Metric Dashboards**: Visual charts for Queries Per Second (QPS), latency distribution, and error rates.

## 6. Technical Stack
*   **Framework**: Electron
*   **Frontend**: React (Vite-powered)
*   **Logic**: Node.js
*   **Communication**: gRPC / Protocol Buffers
*   **Styling**: Vanilla CSS with modern aesthetics (Glassmorphism, Dark Layouts, Smooth Transitions)
*   **Icons**: Lucide React
*   **State Management**: React Context or Zustand (to handle high-frequency updates)

## 7. Folder Structure
```text
sql-m/
├── src/
│   ├── main/               # Electron main process (Node.js)
│   │   ├── grpc-server.js  # gRPC service implementation
│   │   └── main.js         # Electron entry point
│   ├── renderer/           # React frontend
│   │   ├── components/     # UI components (QueryGrid, Sidebar, etc.)
│   │   ├── hooks/          # Custom hooks for data fetching
│   │   ├── store/          # State management
│   │   ├── styles/         # Global CSS and themes
│   │   └── App.tsx         # Main UI entry
│   ├── proto/              # Protobuf definitions (.proto)
│   └── shared/             # Shared types and constants
├── public/                 # Static assets
├── PROJECT_SPEC.md         # Project documentation
├── package.json
└── vite.config.ts
```

## 8. Future Improvements
*   **Persistence**: Persistence layer using SQLite for historical query analysis.
*   **Exporting**: Ability to export filtered query logs to JSON, CSV, or SQL formats.
*   **Alerting**: Integration with notification systems (System notifications, Slack, Discord).
*   **EXPLAIN Integration**: Automatic execution of `EXPLAIN` plans for detected slow queries (where possible).
*   **Multi-source Monitoring**: Support for monitoring multiple gRPC streams simultaneously.
