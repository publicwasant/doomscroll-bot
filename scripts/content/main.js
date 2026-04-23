/**
 * Web Automation Engine v1.0.0 - Main Entry Point
 */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "GET_STATE") {
        sendResponse({ 
            running: window.engine.running, 
            stats: window.engine.stats, 
            currentAction: window.master.state, // ดึงสถานะโดยตรงจาก Master
            supported: true, // หรือเช็คผ่าน utils ถ้าจำเป็น
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
            location.reload();
        });
        sendResponse({ status: "wiping" });
    }
    
    return true; 
});
