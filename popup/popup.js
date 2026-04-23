/**
 * WAE Popup Controller v1.1.0
 */

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const exportBtn = document.getElementById('exportBtn');
    const logsBtn = document.getElementById('logsBtn');
    const wipeBtn = document.getElementById('wipeBtn');
    const statusBadge = document.getElementById('statusBadge');
    
    // UI Update Loop
    const updateUI = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;
            
            chrome.tabs.sendMessage(tabs[0].id, { type: "GET_STATE" }, (response) => {
                if (chrome.runtime.lastError || !response) return;

                // Update Status
                statusBadge.innerText = response.currentAction;
                statusBadge.className = `status-badge status-${response.currentAction.toLowerCase()}`;
                
                if (response.currentAction !== "IDLE" && response.currentAction !== "STOPPED") {
                    startBtn.disabled = true;
                    statusBadge.classList.add('status-running');
                } else {
                    startBtn.disabled = false;
                    statusBadge.classList.remove('status-running');
                }

                // Update Stats
                document.getElementById('statProcessed').innerText = (response.stats && response.stats.postsProcessed) || 0;
            });
        });
    };

    updateUI();
    const uiInterval = setInterval(updateUI, 1000);

    // Start Button
    startBtn.addEventListener('click', () => {
        const selectedActions = Array.from(document.querySelectorAll('.action-cb:checked'))
                                    .map(cb => cb.value);
        const limit = parseInt(document.getElementById('scanLimit').value);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: "START",
                actions: selectedActions,
                filters: {},
                settings: { targets: { type: 'feed', limit: limit } }
            });
        });
    });

    // Stop Button
    stopBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { type: "STOP" });
        });
    });

    // Tool Links
    exportBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { type: "EXPORT_DATA" });
        });
    });

    logsBtn.addEventListener('click', () => {
        // สำหรับการดู Log เราจะบอกให้ผู้ใช้ไปดูที่ Console ตามที่คุณต้องการ
        alert("Check the browser console (F12) to see detailed logs.");
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // สั่งให้พ่น log ออก console ทันทีที่กด
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => { window.postMessage({ type: "WAE_API_REQUEST", method: "get_logs" }, "*"); }
            });
        });
    });

    wipeBtn.addEventListener('click', () => {
        if(confirm("Factory Reset? All stored data will be cleared.")) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { type: "FULL_WIPE_RELOAD" });
            });
        }
    });

    window.addEventListener('unload', () => clearInterval(uiInterval));
});
