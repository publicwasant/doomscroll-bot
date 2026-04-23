/**
 * Main Content Script Entry Point v2.2.5 (Integrated Wipe & Export)
 */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "GET_STATE") {
        sendResponse({ 
            running: window.engine.running, 
            stats: window.engine.stats, 
            currentAction: window.engine.currentActions, 
            supported: isSupportedPage(),
            filters: window.engine.filters,
            settings: window.engine.settings
        });
        return;
    }
    
    if (msg.type === "START") {
        if (!window.engine.running) {
            window.engine.start(msg.actions, msg.filters, msg.settings);
        }
        sendResponse({ status: "ok" });
    }
    
    if (msg.type === "STOP") {
        window.engine.stop();
        sendResponse({ status: "ok" });
    }
    
    if (msg.type === "UPDATE_CONFIG") {
        window.engine.updateConfig(msg.actions, msg.filters, msg.settings);
        sendResponse({ status: "ok" });
    }

    if (msg.type === "FULL_WIPE_RELOAD") {
        window.engine.fullWipe().then(() => {
            location.reload(); // บังคับรีโหลดหน้าเว็บทันทีหลังล้างข้อมูล
        });
        sendResponse({ status: "wiping" });
    }

    if (msg.type === "EXPORT_DATA") {
        window.doomAPI.export().then(res => {
            console.log("[Main] Export result:", res);
        });
        sendResponse({ status: "exporting" });
    }
    
    return true; 
});
