# 🤖 Web Automation Engine (WAE) v1.1.1
### *The Next-Gen Modular Framework for Professional Web Automation*

**Web Automation Engine (WAE)** is a high-level, production-ready Chrome Extension framework designed for scalable and stealthy web automation. Built on the **Master-Observer-Instructor (MOI)** architecture, it transcends simple scripting by providing a decoupled, thread-like system for data discovery and human-mimic execution.

---

## 🏗️ Architecture: The MOI Pattern

WAE operates through a centralized "Brain" and specialized "Action Threads" to ensure maximum flexibility and reliability.

### 1. **Master (The Brain) 🧠**
*Central Controller & Decision Maker*
- **Orchestration**: Manages the mission lifecycle: `Scanning` -> `Processing` -> `Executing`.
- **Intelligence**: Transforms raw discovered data into actionable tasks based on user filters.
- **Central Database**: Maintains a real-time repository of discovered elements and mission statistics.

### 2. **Observer (The Scout) 🔭**
*Passive & Active Discovery Thread*
- **Platform Specific**: Decoupled observers (e.g., `IGObserver`) know exactly how to navigate specific DOM structures.
- **Enriched Extraction**: Captures deep metadata including User IDs, Media Links, and Captions.
- **Robustness**: Features multi-layer fallback selectors to survive website UI updates.

### 3. **Instructor (The Operator) ⚡**
*Human-Mimic Execution Thread*
- **Precision Targeting**: Receives direct DOM references from the Master for 100% accuracy.
- **Stealth Engine**: Powered by `waeUtils` for Gaussian-randomized clicking, smooth scrolling, and variable-speed typing.
- **Atomic Control**: Supports immediate emergency stops and task-state persistence.

---

## 🛠️ Developer API (`wae`)

Control the engine directly from the browser console with a professional-grade API.

| Command | Description |
| :--- | :--- |
| `wae.help()` | Displays the interactive command directory. |
| `wae.start(targets, actions)` | Launches a new mission (e.g., `wae.start({limit:10}, ['LIKE', 'SAVE'])`). |
| `wae.stop()` | Immediate emergency stop of all active threads. |
| `wae.logs()` | Displays a professional `console.table` of internal engine logs. |
| `wae.data()` | Inspects the current data held in Master's memory. |
| `wae.state()` | Shows the real-time status of the engine (IDLE, SCANNING, EXECUTING). |
| `wae.export()` | Generates and downloads a cleaned JSON export of all collected data. |
| `wae.wipe()` | Factory reset: Clears all local storage and internal databases. |

---

## 🚀 Key Features

- **Enriched Data**: Scans for more than just links; captures captions, usernames, and media sources.
- **Professional Logging**: Silent operation by default. Access detailed logs only when you need them via `wae.logs()`.
- **Human-Mimicry 2.0**: Gaussian distribution for click offsets and smooth scroll behaviors.
- **Platform Modularization**: Ready for expansion to Facebook, Threads, TikTok, etc., by simply adding new Platform Classes.
- **Clean UI**: A modern, real-time dashboard for controlling missions and monitoring stats.

---

## 📁 Project Structure

```text
scripts/content/
├── core/
│   ├── Master.js           # Central Intelligence
│   ├── BaseObserver.js     # Scout Prototype
│   ├── BaseInstructor.js   # Operator Prototype
│   └── platforms/
│       └── instagram/      # IG Specific Implementation
├── utils.js                # Stealth & Helper Suite
├── bridge.js               # Console API (wae)
├── engine.js               # Main Adapter
└── main.js                 # Message Entry Point
```

---

## ⚙️ Installation

1. Clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the project folder.
5. Open Instagram and start your first mission via the popup or console!

---

## 👨‍💻 Evolved by
**Web Automation Engine Team**
*Architecture redesigned for Scalability, Stealth, and Precision.*

---
**Professional Web Automation** | **WAE v1.1.1**
