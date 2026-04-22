/**
 * Main Content Script Entry Point v1.2.0
 */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "GET_STATE") {
        sendResponse({ 
            running: window.engine.running, 
            stats: window.engine.stats, 
            currentAction: window.engine.currentActions, 
            supported: isSupportedPage(),
            filters: window.engine.filters
        });
        return;
    }
    
    if (msg.type === "START") {
        if (!window.engine.running) {
            window.engine.start(msg.actions, msg.filters);
        }
        sendResponse({ status: "ok" });
    }
    
    if (msg.type === "STOP") {
        window.engine.stop();
        sendResponse({ status: "ok" });
    }
    
    if (msg.type === "UPDATE_CONFIG") {
        window.engine.updateConfig(msg.actions, msg.filters);
        sendResponse({ status: "ok" });
    }

    if (msg.type === "RESET_ENGINE") {
        window.engine.resetInternalState();
        sendResponse({ status: "ok" });
    }
    
    return true; 
});
