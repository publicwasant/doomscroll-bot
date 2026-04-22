/**
 * Doomscroll Bot - Main World Bridge v1.7.0
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
    
    // --- Management ---
    export: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "export" }, "*"),
    wipe: () => {
        if(confirm("Confirm Wipe? All learned data will be lost.")) {
            window.postMessage({ type: "DOOM_API_REQUEST", method: "wipe" }, "*");
        }
    },
    stackTrace: () => window.postMessage({ type: "DOOM_API_REQUEST", method: "stackTrace" }, "*"),

    help: () => {
        console.group("%c🕵️‍♂️ Doomscroll Bot Developer API v1.7.0", "color: #bc1888; font-size: 14px; font-weight: bold;");
        console.table({
            "doom.posts()": "Show all discovered posts",
            "doom.users()": "Show all learned users",
            "doom.hashtag()": "Show all learned hashtags",
            "doom.queue()": "Show current Instructor task queue",
            "doom.state()": "Show operational stats & status",
            "doom.target()": "Show post currently being processed",
            "doom.start()": "Manual start with parameters",
            "doom.stop()": "Stop bot engine",
            "doom.export()": "Download JSON report",
            "doom.wipe()": "Clear all storage"
        });
        console.groupEnd();
    }
};

console.log("%c[Doomscroll] Bridge v1.7.0 Ready. Type doom.help()", "color: #bc1888; font-weight: bold;");
