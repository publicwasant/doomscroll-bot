/**
 * Professional MVVM Implementation for Popup v1.2.1
 */

class PopupViewModel {
    constructor() {
        this.state = {
            isRunning: false,
            stats: { success: 0 },
            statusMessage: "System Standby",
            selectedActions: ["LIKE"],
            filters: {
                tags: [], 
                mode: 'EXCLUDE'
            },
            version: chrome.runtime.getManifest().version,
            suggestions: [],
            selectedSuggestIdx: -1
        };

        this.elements = {
            btnPlay: document.getElementById("btnPlay"),
            btnCount: document.getElementById("btnCount"),
            btnLabel: document.getElementById("btnLabel"),
            statusLabel: document.getElementById("statusLabel"),
            versionLabel: document.getElementById("versionLabel"),
            actionInputs: document.querySelectorAll('input[name="action"]'),
            filterInput: document.getElementById("filterInput"),
            suggestionBox: document.getElementById("suggestionBox"),
            tagsDisplay: document.getElementById("tagsDisplay"),
            modeBtns: document.querySelectorAll(".segment-btn")
        };

        this.lastRenderedTags = "";
        this.init();
    }

    init() {
        if (this.elements.versionLabel) this.elements.versionLabel.textContent = this.state.version;

        this.elements.btnPlay.onclick = () => this.toggleWorkflow();
        
        this.elements.actionInputs.forEach(input => {
            input.onchange = () => this.updateSelectedActions();
        });

        this.elements.modeBtns.forEach(btn => {
            btn.onclick = () => {
                this.state.filters.mode = btn.dataset.mode;
                this.render();
                this.syncConfigWithContent();
            };
        });

        this.initFilterInput();
        this.initDragToScroll();
        chrome.runtime.onMessage.addListener((msg) => this.handleRuntimeMessages(msg));
        this.fetchCurrentState();
    }

    initFilterInput() {
        const input = this.elements.filterInput;

        input.oninput = async () => {
            const val = input.value;
            if (val.startsWith('@')) {
                const query = val.slice(1).toLowerCase();
                const { observedList = [] } = await chrome.storage.local.get("observedList");
                this.state.suggestions = observedList
                    .filter(u => u.toLowerCase().includes(query))
                    .slice(0, 15); 
                this.state.selectedSuggestIdx = -1;
                this.renderSuggestions();
            } else {
                this.hideSuggestions();
            }
        };

        input.onkeydown = (e) => {
            if (this.state.suggestions.length > 0) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    this.state.selectedSuggestIdx = Math.min(this.state.selectedSuggestIdx + 1, this.state.suggestions.length - 1);
                    this.renderSuggestions();
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    this.state.selectedSuggestIdx = Math.max(this.state.selectedSuggestIdx - 1, 0);
                    this.renderSuggestions();
                } else if (e.key === "Enter" && this.state.selectedSuggestIdx >= 0) {
                    e.preventDefault();
                    this.addTag('user', this.state.suggestions[this.state.selectedSuggestIdx]);
                    return;
                }
            }

            if (e.key === "Enter" && input.value.trim()) {
                const val = input.value.trim();
                if (val.startsWith('@')) {
                    this.addTag('user', val.slice(1));
                } else {
                    this.addTag('keyword', val);
                }
            }
        };

        document.addEventListener('click', (e) => {
            if (!this.elements.filterInput.contains(e.target)) this.hideSuggestions();
        });
    }

    initDragToScroll() {
        const slider = this.elements.tagsDisplay;
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        slider.addEventListener('mouseleave', () => {
            isDown = false;
        });
        slider.addEventListener('mouseup', () => {
            isDown = false;
        });
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; 
            slider.scrollLeft = scrollLeft - walk;
        });
        
        // Horizontal scroll with mouse wheel
        slider.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                slider.scrollLeft += e.deltaY;
            }
        });
    }

    addTag(type, value) {
        if (!value) return;
        const exists = this.state.filters.tags.some(t => t.type === type && t.value === value);
        if (!exists) {
            this.state.filters.tags.push({ type, value });
            this.render();
            this.syncConfigWithContent();
            
            // Auto scroll to end when new tag added
            setTimeout(() => {
                this.elements.tagsDisplay.scrollTo({
                    left: this.elements.tagsDisplay.scrollWidth,
                    behavior: 'smooth'
                });
            }, 100);
        }
        this.elements.filterInput.value = "";
        this.hideSuggestions();
    }

    removeTag(index) {
        this.state.filters.tags.splice(index, 1);
        this.render();
        this.syncConfigWithContent();
    }

    renderSuggestions() {
        const box = this.elements.suggestionBox;
        if (this.state.suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        box.innerHTML = this.state.suggestions.map((s, i) => `
            <div class="suggestion-item ${i === this.state.selectedSuggestIdx ? 'selected' : ''}" data-index="${i}">
                @<b>${s}</b>
            </div>
        `).join('');
        
        box.style.display = "block";

        const selectedEl = box.querySelector('.suggestion-item.selected');
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }

        box.querySelectorAll('.suggestion-item').forEach(item => {
            item.onclick = () => this.addTag('user', this.state.suggestions[item.dataset.index]);
        });
    }

    hideSuggestions() {
        this.state.suggestions = [];
        this.elements.suggestionBox.style.display = "none";
    }

    async fetchCurrentState() {
        const tab = await this.getActiveTab();
        if (!tab || !tab.url?.includes("instagram.com")) return;

        chrome.tabs.sendMessage(tab.id, { type: "GET_STATE" }, (res) => {
            if (chrome.runtime.lastError || !res) return;
            this.updateState({
                isRunning: res.running,
                stats: res.stats,
                selectedActions: res.currentAction || this.state.selectedActions,
                isSupported: res.supported
            });
        });
    }

    async toggleWorkflow() {
        const tab = await this.getActiveTab();
        if (!tab) return;

        if (!this.state.isRunning) {
            this.updateState({ isRunning: true, statusMessage: "Initiating redaction protocol..." });
            chrome.tabs.sendMessage(tab.id, { 
                type: "START", 
                actions: this.state.selectedActions,
                filters: this.state.filters
            });
        } else {
            chrome.tabs.sendMessage(tab.id, { type: "STOP" }, () => {
                this.updateState({ isRunning: false });
            });
        }
    }

    updateSelectedActions() {
        this.state.selectedActions = Array.from(this.elements.actionInputs)
            .filter(i => i.checked)
            .map(i => i.value);
        this.syncConfigWithContent();
    }

    async syncConfigWithContent() {
        const tab = await this.getActiveTab();
        if (tab && this.state.isRunning) {
            chrome.tabs.sendMessage(tab.id, { 
                type: "UPDATE_CONFIG", 
                actions: this.state.selectedActions,
                filters: this.state.filters
            });
        }
    }

    handleRuntimeMessages(msg) {
        if (msg.type === "STATS_UPDATE") {
            this.updateState({
                stats: msg.stats,
                statusMessage: msg.msg || this.state.statusMessage,
                isRunning: msg.running
            });
        }
        if (msg.type === "WORKFLOW_COMPLETE") {
            this.updateState({ isRunning: false, statusMessage: msg.summary || "Mission Complete" });
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
        const { isRunning, stats, statusMessage, selectedActions, filters } = this.state;

        if (isRunning) {
            this.elements.btnLabel.style.display = "none";
            this.elements.btnCount.style.display = "block";
            this.elements.btnCount.textContent = stats.success || 0;
            this.elements.btnPlay.classList.add("is-running");
        } else {
            this.elements.btnLabel.style.display = "block";
            this.elements.btnLabel.textContent = "INITIATE";
            this.elements.btnCount.style.display = "none";
            this.elements.btnPlay.classList.remove("is-running");
        }

        this.elements.statusLabel.textContent = statusMessage;

        this.elements.modeBtns.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.mode === filters.mode);
        });

        const tagsJson = JSON.stringify(filters.tags);
        if (this.lastRenderedTags !== tagsJson) {
            this.elements.tagsDisplay.innerHTML = filters.tags.map((tag, i) => `
                <div class="tag ${tag.type === 'user' ? 'tag-user' : 'tag-kw'}">
                    <span>${tag.type === 'user' ? '@' : ''}${tag.value}</span>
                    <span class="tag-remove" data-index="${i}">&times;</span>
                </div>
            `).join('');

            this.elements.tagsDisplay.querySelectorAll('.tag-remove').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation(); // Prevent drag event
                    this.removeTag(btn.dataset.index);
                };
            });
            this.lastRenderedTags = tagsJson;
        }

        this.elements.actionInputs.forEach(input => {
            input.checked = selectedActions.includes(input.value);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PopupViewModel();
});
