# 🕵️‍♂️ Doomscroll Bot v2.0.0
### *The Ultimate Triple-Thread Web Automation Framework*

**Doomscroll Bot** is a professional-grade Chrome Extension designed for high-precision digital legacy curation. Unlike standard scripts, v2.0.0 introduces a **Modular Universal Framework** that mimics human behavior while building an autonomous intelligence database of your social interactions.

---

## 🏗️ Architecture: The Triple-Thread System

Version 2.0.0 is re-engineered from the ground up using an **Asynchronous Task-Based Architecture**. The system operates through three specialized threads:

### 1. **Data Center (The Librarian) 📚**
*Thread 1: Storage & Indexing*
- **Source of Truth**: Centralized management of `all_posts`, `all_user`, and `all_hashtag`.
- **Auto-Indexing**: Automatically extracts and categorizes data from scanned posts.
- **Persistence**: Handles mission-critical data I/O using `chrome.storage.local`.

### 2. **Observer (The Scout) 🔭**
*Thread 2: Real-time Discovery*
- **Reactive Scanning**: Detects content changes instantly using `MutationObserver`.
- **Deep Extraction**: Features a "strike-on-open" strategy to capture full metadata.
- **Discovery Queue**: Feeds potential targets to the Instructor.

### 3. **Instructor (The Commander) ⚡**
*Thread 3: Workflow Execution*
- **Atomic Stop**: Robust kill-switch mechanism for immediate halting.
- **Human-Mimic Engine**: Simulated natural movement and jittered coordinates.
- **Queue Consumer**: Autonomous cycle with self-healing auto-scrolling.

---

## 🛠️ Developer API (The Doom Bridge)

The bot exposes a powerful `doom` object in the browser console for inspection and automation.

| Command | Return Type | Description |
| :--- | :--- | :--- |
| `doom.help()` | `void` | Displays the command directory and usage tips. |
| `doom.posts()` | `Array<Object>` | Lists all discovered posts with metadata (href, user, caption). |
| `doom.users()` | `Array<String>` | Lists all unique usernames learned by the bot. |
| `doom.hashtag()` | `Array<String>` | Lists all hashtags extracted from scanned posts. |
| `doom.queue()` | `Array<String>` | Shows the current backlog of tasks waiting for execution. |
| `doom.state()` | `Object` | Real-time stats (success rate, done count) and engine status. |
| `doom.target()` | `Object \| null` | Inspects metadata of the post currently being processed. |
| `doom.health()` | `Object` | Runs a diagnostic on Instagram's UI selectors (DOM Health). |
| `doom.config()` | `Object` | Shows current bot configuration (Active Actions & Filters). |
| `doom.start(act, cond, tags)` | `void` | Manual trigger. Parameters: `actions` (Array), `condition` (String), `tags` (Array). |
| `doom.stop()` | `void` | Immediate emergency stop of the Instructor thread. |
| `doom.sync()` | `Promise<String>` | Force syncs the internal memory queue to local storage. |
| `doom.export()` | `Promise` | Generates a **Full System Snapshot** (Data + State + Errors) as JSON. |
| `doom.wipe()` | `void` | Factory reset. Clears all learned data, storage, and reloads page. |
| `doom.stackTrace()` | `Array<Object>` | Lists recent internal error logs with context and timestamps. |

---

## 🚀 Core Capabilities

- **Surgical Filtering**: Precise targeting by `@user`, `#hashtag`, or `keyword` with logic conditions.
- **Passive Intelligence**: Knowledge base builds automatically as you browse normally.
- **Human behavior**: Evades detection through randomized patterns and smooth traversal.

---

## ⚙️ Installation & Usage

1. **Load**: Enable **Developer mode** in `chrome://extensions/` and click **Load unpacked**.
2. **Navigate**: Open Instagram (Explore, Profile, or Saved).
3. **Configure**: Select activities and filters in the popup.
4. **Deploy**: Hit **Play** or type `doom.start()` in console.

---

## 🛡 Security & Privacy
- **Local-Only**: Data never leaves your machine. No external trackers.
- **Stealth**: Randomized interaction patterns to protect your account safety.

---

## 👨‍💻 Author
Built with passion by **[publicwasant](https://github.com/publicwasant/doomscroll-bot)**.
*"Rewriting history, one task at a time."*

---
**Universal Automation Framework** | **IG Doomscroll Bot v2.0.0**
