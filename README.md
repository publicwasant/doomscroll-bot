# 🕵️‍♂️ Doomscroll Bot
### *Based DOM Automation*

<p align="center">
  <img src="assets/screenshot-v1.3.0/Screenshot%202569-04-22%20at%2017.18.50.png" width="180">
  <img src="assets/screenshot-v1.3.0/Screenshot%202569-04-22%20at%2017.19.39.png" width="180">
  <br>
  <img src="assets/screenshot-v1.3.0/Screenshot%202569-04-22%20at%2017.19.44.png" width="180">
  <img src="assets/screenshot-v1.3.0/Screenshot%202569-04-22%20at%2017.19.51.png" width="180">
</p>

**Doomscroll Bot** is a high-end, minimalist Chrome Extension designed for those who want to curate their digital legacy. It provides a seamless, automated way to manage your past interactions on Instagram—allowing you to "rewrite" your history with surgical precision and human-like behavior.

---

## 🏗️ Architecture: The Triple-Thread System (v1.7.5)

Doomscroll Bot is built on a high-performance **Asynchronous Task-Based Architecture**, splitting responsibilities into three specialized "threads" that communicate in real-time:

### 1. **Data Center (The Librarian) 📚**
The **Source of Truth** for the entire system.
- **Master Registry**: Manages `all_posts`, ensuring no interaction is ever repeated.
- **Auto-Indexing**: Automatically extracts usernames and hashtags from scanned posts to build the **Live Suggestion** database.
- **Persistence**: Handles all I/O with `chrome.storage.local` to ensure your data is safe across sessions.

### 2. **Observer (The Scout) 🔭**
The **Intelligent Scanner** that never sleeps.
- **Reactive Discovery**: Uses `MutationObserver` to detect new posts the microsecond they appear on your screen.
- **On-Demand Extraction**: When a post is opened, the Observer "strikes" to capture deep metadata (full captions and hashtags) that are invisible from the main feed.
- **Queueing**: Forwards discovered targets to the Instructor for processing.

### 3. **Instructor (The Commander) ⚡**
The **Workflow Engine** that executes your orders.
- **Queue Management**: Consumes the task list provided by the Observer, prioritizing efficiency.
- **Human-Mimicry**: Coordinates the surgical "Open -> Analyze -> Action -> Close" cycle with randomized delays and jittered interactions to remain undetected.
- **Self-Correction**: Automatically scrolls and hunts for more data if the task queue runs dry.

---

## 🚀 Core Features

### 1. **Advanced Logic Filters** 🎯
- **Surgical Precision**: Filter interactions by `@username`, `#hashtag`, or specific `keywords`.
- **Flexible Conditions**: Supports `is`, `is not`, `contains`, `does not contain`, `is empty`, and `is not empty`.
- **Post-Centric Intelligence**: Decisions are based on real, deep-scanned post data, not superficial feed info.

### 2. **Human-Mimic Engine** 🧠
- **Natural Behavior**: Jittered interaction coordinates and smooth scrolling profiles.
- **Intelligence Bridge**: A dedicated API that allows developers to inspect and control the engine directly from the browser console.

---

## 🛠 Developer API (Console)

Type `doom.help()` in your browser console to see the full command list:

| Command | Description |
| :--- | :--- |
| `doom.posts()` | List all discovered posts with full metadata (user, caption). |
| `doom.users()` | List all unique usernames the bot has learned. |
| `doom.hashtag()` | List all hashtags extracted from captions. |
| `doom.queue()` | Show the current backlog of tasks waiting for the Instructor. |
| `doom.state()` | Show real-time operational stats and engine status. |
| `doom.target()` | Inspect the post currently being processed by the bot. |
| `doom.health()` | Run a diagnostic on Instagram's UI selectors. |
| `doom.start(actions, cond, tags)` | Trigger the redaction protocol via console. |
| `doom.stop()` | Immediate emergency stop. |
| `doom.export()` | Generate and download a full JSON report of all intelligence. |
| `doom.wipe()` | Factory reset all learned data and history. |

---

## ⚙️ Installation & Usage

1. **Load**: Enable **Developer mode** in `chrome://extensions/` and click **Load unpacked** to select the project folder.
2. **Navigate**: Open Instagram and go to **Explore**, a **Profile**, or your **Saved** items.
3. **Configure**: Select your desired activities (Like, Repost, Save) and set your filters in the popup.
4. **Deploy**: Hit the **Play** icon to initiate the redaction protocol.

---

## 🛡 Privacy & Safety
- **Local-Only**: Your data never leaves your computer. No external APIs or trackers.
- **Stealth-First**: Human-like pacing and randomized interaction patterns are strictly enforced.

---

## 👨‍💻 Author
Built with passion by **[publicwasant](https://github.com/publicwasant/doomscroll-bot)**.
*"Rewriting history, one post at a time."*

---
**GitHub Open Source** | **IG Doomscroll Bot v1.7.5**
