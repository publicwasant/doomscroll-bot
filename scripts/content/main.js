/**
 * Main Content Script Entry Point
 */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "GET_STATE") {
        sendResponse({ 
            running: window.engine.running, 
            stats: window.engine.stats, 
            currentAction: window.engine.currentActions, 
            supported: isSupportedPage() 
        });
        return;
    }
    
    if (msg.type === "START") {
        if (!window.engine.running) window.engine.start(msg.actions);
        sendResponse({ status: "ok" });
    }
    
    if (msg.type === "STOP") {
        window.engine.stop();
        sendResponse({ status: "ok" });
    }
    
    if (msg.type === "UPDATE_CONFIG") {
        window.engine.updateConfig(msg.actions);
        sendResponse({ status: "ok" });
    }
    
    return true; 
});
