/**
 * Doomscroll Bot - Main World Bridge v2.2.5
 */

window.doom = {
    // --- Data Center Queries ---
    posts: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "posts" }, "*"),
    users: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "users" }, "*"),
    hashtag: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "hashtag" }, "*"),
    found: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "found" }, "*"),
    
    // --- Queue & State ---
    queue: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "queue" }, "*"),
    state: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "state" }, "*"),
    target: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "target" }, "*"),
    
    // --- Control ---
    start: (actions = ["LIKE"], condition = "NONE", tags = []) => {
        window.postMessage({ type: "DOOM_API_REQUEST", method: "start", params: { actions, filters: { condition, tags } } }, "*");
    },
    stop: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "stop" }, "*"),
    sync: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "sync" }, "*"),
    
    // --- Debug & Health ---
    health: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "health" }, "*"),
    config: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "config" }, "*"),
    stackTrace: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "stackTrace" }, "*"),

    // --- Management ---
    export: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "export" }, "*"),
    wipe: () => {
        if(confirm("Confirm Wipe? All learned data will be lost.")) {
            window.postMessage({ type: "DOOM_API_REQUEST", method: "wipe" }, "*");
        }
    },

    /**
     * Shows command directory in console (Synced with README.md)
     */
    help: () => {
        console.group("%c🕵️‍♂️ Doomscroll Bot Developer API v2.2.5", "color: #bc1888; font-size: 14px; font-weight: bold;");
        console.table([
            { Command: "doom.posts()", "Return Type": "Array<Object>", Description: "Lists all discovered posts with metadata (user, caption)." },
            { Command: "doom.users()", "Return Type": "Array<String>", Description: "Lists all unique usernames learned by the bot." },
            { Command: "doom.hashtag()", "Return Type": "Array<String>", Description: "Lists all hashtags extracted from scanned posts." },
            { Command: "doom.queue()", "Return Type": "Array<String>", Description: "Shows the current backlog of tasks waiting for execution." },
            { Command: "doom.state()", "Return Type": "Object", Description: "Real-time stats (success rate, done count) and engine status." },
            { Command: "doom.target()", "Return Type": "Object | null", Description: "Inspects metadata of the post currently being processed." },
            { Command: "doom.health()", "Return Type": "Object", Description: "Runs a diagnostic on Instagram's UI selectors (DOM Health)." },
            { Command: "doom.config()", "Return Type": "Object", Description: "Shows current bot configuration (Active Actions & Filters)." },
            { Command: "doom.start(act, cond, tags)", "Return Type": "void", Description: "Manual trigger. Start redaction protocol with parameters." },
            { Command: "doom.stop()", "Return Type": "void", Description: "Immediate emergency stop of the Instructor thread." },
            { Command: "doom.sync()", "Return Type": "Promise<String>", Description: "Force syncs the internal memory queue to local storage." },
            { Command: "doom.export()", "Return Type": "Promise", Description: "Generates and downloads a full JSON report snapshot." },
            { Command: "doom.wipe()", "Return Type": "void", Description: "Factory reset. Clears all data and history." },
            { Command: "doom.stackTrace()", "Return Type": "Array<Object>", Description: "Lists recent internal error logs with context." }
        ]);
        console.log("%cTip: Use 'top' context in console to access these commands.", "color: #888; font-style: italic;");
        console.groupEnd();
    }
};

console.log("%c[Doomscroll] Bridge v2.2.5 Ready. Type doom.help()", "color: #bc1888; font-weight: bold;");
