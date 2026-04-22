/**
 * MVVM Implementation for Popup
 */

// --- Model / State ---
const initialState = {
    isRunning: false,
    stats: { success: 0 },
    statusMessage: "System Idle",
    selectedActions: ["LIKE"], // Default
    isSupported: true,
    version: chrome.runtime.getManifest().version
};

// --- ViewModel ---
class PopupViewModel {
    constructor(state) {
        this.state = { ...state };
        
        // UI Elements
        this.elements = {
            btnPlay: document.getElementById("btnPlay"),
            btnCount: document.getElementById("btnCount"),
            btnLabel: document.getElementById("btnLabel"),
            statusLabel: document.getElementById("statusLabel"),
            versionLabel: document.getElementById("versionLabel"),
            actionInputs: document.querySelectorAll('input[name="action"]')
        };

        this.init();
    }

    init() {
        // Set Initial Version from Manifest
        if (this.elements.versionLabel) {
            this.elements.versionLabel.textContent = this.state.version;
        }

        this.elements.btnPlay.onclick = () => this.toggleWorkflow();
        
        this.elements.actionInputs.forEach(input => {
            input.onchange = () => {
                this.updateSelectedActions();
                if (this.state.isRunning) this.syncConfigWithContent();
            };
        });

        chrome.runtime.onMessage.addListener((msg) => this.handleRuntimeMessages(msg));
        this.fetchCurrentState();
    }

    async fetchCurrentState() {
        const tab = await this.getActiveTab();
        if (!tab || !tab.url?.includes("instagram.com")) return;

        chrome.tabs.sendMessage(tab.id, { type: "GET_STATE" }, (res) => {
            if (chrome.runtime.lastError || !res) return;
            
            this.updateState({
                isRunning: res.running,
                stats: res.stats,
                selectedActions: Array.isArray(res.currentAction) ? res.currentAction : [res.currentAction],
                isSupported: res.supported
            });
            
            if (!res.supported && !res.running) {
                this.updateState({ statusMessage: "Please navigate to 'Your Activity' to start." });
            }
        });
    }

    async toggleWorkflow() {
        const tab = await this.getActiveTab();
        if (!tab) return;

        if (!this.state.isRunning) {
            if (this.state.selectedActions.length === 0) {
                this.updateState({ statusMessage: "Please select at least one activity." });
                return;
            }
            
            this.updateState({ isRunning: true, statusMessage: "Initiating redaction protocol..." });
            
            chrome.tabs.sendMessage(tab.id, { 
                type: "START", 
                actions: this.state.selectedActions 
            }, (res) => {
                if (chrome.runtime.lastError) {
                    this.updateState({ isRunning: false, statusMessage: "Please refresh Instagram to sync." });
                }
            });
        } else {
            chrome.tabs.sendMessage(tab.id, { type: "STOP" }, () => {
                this.updateState({ isRunning: false });
            });
        }
    }

    updateSelectedActions() {
        const actions = Array.from(this.elements.actionInputs)
            .filter(i => i.checked)
            .map(i => i.value);
        this.updateState({ selectedActions: actions });
    }

    async syncConfigWithContent() {
        const tab = await this.getActiveTab();
        if (tab) {
            chrome.tabs.sendMessage(tab.id, { 
                type: "UPDATE_CONFIG", 
                actions: this.state.selectedActions 
            });
        }
    }

    handleRuntimeMessages(msg) {
        if (msg.type === "STATS_UPDATE") {
            this.updateState({
                stats: msg.stats,
                statusMessage: msg.msg || this.state.statusMessage,
                isSupported: msg.supported
            });
        }
        
        if (msg.type === "WORKFLOW_COMPLETE") {
            this.updateState({
                isRunning: false,
                statusMessage: msg.summary || "Mission Complete"
            });
        }
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }

    async getActiveTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
    }

    render() {
        const { isRunning, stats, statusMessage, selectedActions } = this.state;

        if (isRunning) {
            this.elements.btnLabel.style.display = "none";
            this.elements.btnCount.style.display = "block";
            this.elements.btnCount.textContent = stats.success || 0;
            this.elements.btnPlay.classList.add("is-running");
        } else {
            this.elements.btnLabel.style.display = "block";
            this.elements.btnLabel.textContent = "START";
            this.elements.btnCount.style.display = "none";
            this.elements.btnPlay.classList.remove("is-running");
        }

        this.elements.statusLabel.textContent = statusMessage;

        this.elements.actionInputs.forEach(input => {
            input.checked = selectedActions.includes(input.value);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PopupViewModel(initialState);
});
