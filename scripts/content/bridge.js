/**
 * Web Automation Engine - Main World Bridge v1.1.0
 */

window.wae = {
    // --- State & Intelligence ---
    state: () => window.postMessage({ type: "WAE_API_REQUEST", method: "state" }, "*"),
    data: () => window.postMessage({ type: "WAE_API_REQUEST", method: "data" }, "*"),
    config: () => window.postMessage({ type: "WAE_API_REQUEST", method: "config" }, "*"),
    
    // --- Mission Control ---
    start: (targets = { type: 'feed' }, actions = ['PROCESS'], filters = {}) => {
        window.postMessage({ 
            type: "WAE_API_REQUEST", 
            method: "start", 
            params: { targets, actions, filters } 
        }, "*");
    },
    
    stop: () => window.postMessage({ type: "WAE_API_REQUEST", method: "stop" }, "*"),
    
    // --- Data & Logs ---
    export: () => window.postMessage({ type: "WAE_API_REQUEST", method: "export" }, "*"),
    
    logs: () => {
        window.postMessage({ type: "WAE_API_REQUEST", method: "get_logs" }, "*");
    },

    wipe: () => {
        if(confirm("Factory Reset? All stored data will be cleared.")) {
            window.postMessage({ type: "WAE_API_REQUEST", method: "wipe" }, "*");
        }
    },

    help: () => {
        console.group("%c🤖 Web Automation Engine API v1.1.0", "color: #2ecc71; font-size: 14px; font-weight: bold;");
        console.table([
            { Command: "wae.state()", Description: "Show current engine status." },
            { Command: "wae.data()", Description: "View all collected data." },
            { Command: "wae.logs()", Description: "View internal engine logs." },
            { Command: "wae.start(targets, actions)", Description: "Launch a mission." },
            { Command: "wae.stop()", Description: "Emergency stop." },
            { Command: "wae.export()", Description: "Download data as JSON." }
        ]);
        console.groupEnd();
    }
};

console.log("%c[WAE] Bridge v1.1.0 Loaded. Type 'wae.help()' for commands.", "color: #2ecc71; font-weight: bold;");
