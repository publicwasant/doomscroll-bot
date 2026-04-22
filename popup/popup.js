/**
 * Professional MVVM Implementation for Popup v1.3.0
 */

class PopupViewModel {
    constructor() {
        this.conditions = [
            { id: 'NONE', label: 'none' },
            { id: 'CONTAINS', label: 'contains' },
            { id: 'DOES_NOT_CONTAIN', label: 'does not contain' },
            { id: 'IS', label: 'is' },
            { id: 'IS_NOT', label: 'is not' },
            { id: 'IS_EMPTY', label: 'is empty' },
            { id: 'IS_NOT_EMPTY', label: 'is not empty' }
        ];

        this.state = {
            isRunning: false,
            stats: { success: 0 },
            statusMessage: "System Standby",
            selectedActions: ["LIKE"],
            filters: {
                tags: [], 
                condition: 'NONE'
            },
            version: "",
            suggestions: [],
            selectedSuggestIdx: -1,
            isDropdownOpen: false
        };

        this.elements = {
            btnPlay: document.getElementById("btnPlay"),
            btnCount: document.getElementById("btnCount"),
            btnLabel: document.getElementById("btnLabel"),
            statusLabel: document.getElementById("statusLabel"),
            versionLabel: document.getElementById("versionLabel"),
            versionContainer: document.getElementById("versionContainer"),
            actionInputs: document.querySelectorAll('input[name="action"]'),
            filterInput: document.getElementById("filterInput"),
            filterInputGroup: document.getElementById("filterInputGroup"),
            suggestionBox: document.getElementById("suggestionBox"),
            tagsDisplay: document.getElementById("tagsDisplay"),
            tagsDisplayWrapper: document.getElementById("tagsDisplayWrapper"),
            btnReset: document.getElementById("btnReset"),
            
            conditionTrigger: document.getElementById("conditionTrigger"),
            conditionMenu: document.getElementById("conditionMenu"),
            currentConditionText: document.getElementById("currentConditionText")
        };

        this.lastRenderedTags = "";
        this.init();
    }

    async init() {
        // Try to get version from manifest
        try {
            this.state.version = chrome.runtime.getManifest().version;
            if (this.state.version && this.elements.versionLabel) {
                this.elements.versionLabel.textContent = this.state.version;
                this.elements.versionContainer.style.display = 'block';
            }
        } catch (e) {
            console.warn("Could not retrieve version from manifest");
        }

        // Load persisted state from storage
        const saved = await chrome.storage.local.get(["filters", "selectedActions"]);
        if (saved.filters) this.state.filters = saved.filters;
        if (saved.selectedActions) this.state.selectedActions = saved.selectedActions;

        this.elements.btnPlay.onclick = () => this.toggleWorkflow();
        
        this.elements.actionInputs.forEach(input => {
            input.onchange = () => this.updateSelectedActions();
        });

        // Custom Dropdown Event
        this.elements.conditionTrigger.onclick = (e) => {
            e.stopPropagation();
            this.state.isDropdownOpen = !this.state.isDropdownOpen;
            this.render();
        };

        if (this.elements.btnReset) {
            this.elements.btnReset.onclick = () => this.factoryReset();
        }

        this.initFilterInput();
        this.initDragToScroll();
        
        document.addEventListener('click', () => {
            if (this.state.isDropdownOpen) {
                this.state.isDropdownOpen = false;
                this.render();
            }
        });

        chrome.runtime.onMessage.addListener((msg) => this.handleRuntimeMessages(msg));
        
        this.render();
        this.fetchCurrentState();
    }

    async factoryReset() {
        if (!confirm("Factory Reset? This will clear all filters, stats, and observed usernames.")) return;
        
        const tab = await this.getActiveTab();
        if (tab) chrome.tabs.sendMessage(tab.id, { type: "STOP" });

        await chrome.storage.local.clear();

        this.state = {
            ...this.state,
            isRunning: false,
            stats: { success: 0 },
            statusMessage: "System Standby",
            selectedActions: ["LIKE"],
            filters: {
                tags: [], 
                condition: 'NONE'
            },
            suggestions: [],
            selectedSuggestIdx: -1
        };

        this.render();
        
        if (tab) chrome.tabs.sendMessage(tab.id, { type: "RESET_ENGINE" });
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
                    .map(u => ({ type: 'user', value: u }))
                    .slice(0, 15); 
                this.state.selectedSuggestIdx = -1;
                this.renderSuggestions();
            } else if (val.startsWith('#')) {
                const query = val.slice(1).toLowerCase();
                const { hashtagList = [] } = await chrome.storage.local.get("hashtagList");
                this.state.suggestions = hashtagList
                    .filter(h => h.toLowerCase().includes(query))
                    .map(h => ({ type: 'hashtag', value: h }))
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
                    const s = this.state.suggestions[this.state.selectedSuggestIdx];
                    this.addTag(s.type, s.value);
                    return;
                }
            }

            if (e.key === "Enter" && input.value.trim()) {
                const val = input.value.trim();
                if (val.startsWith('@')) {
                    this.addTag('user', val.slice(1));
                } else if (val.startsWith('#')) {
                    this.addTag('hashtag', val.slice(1));
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
        
        slider.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                slider.scrollLeft += e.deltaY;
            }
        });
    }

    async addTag(type, value) {
        if (!value) return;
        const exists = this.state.filters.tags.some(t => t.type === type && t.value === value);
        if (!exists) {
            this.state.filters.tags.push({ type, value });
            await this.persistAndSync();
            
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

    async removeTag(index) {
        this.state.filters.tags.splice(index, 1);
        await this.persistAndSync();
    }

    renderSuggestions() {
        const box = this.elements.suggestionBox;
        if (this.state.suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        box.innerHTML = this.state.suggestions.map((s, i) => `
            <div class="suggestion-item ${i === this.state.selectedSuggestIdx ? 'selected' : ''}" data-index="${i}">
                <span>${s.type === 'user' ? '@' : '#'}<b>${s.value}</b></span>
            </div>
        `).join('');
        
        box.style.display = "block";

        const selectedEl = box.querySelector('.suggestion-item.selected');
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }

        box.querySelectorAll('.suggestion-item').forEach(item => {
            item.onclick = () => {
                const s = this.state.suggestions[item.dataset.index];
                this.addTag(s.type, s.value);
            };
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
                isSupported: res.supported
            });
            if (res.running) {
                this.updateState({
                    selectedActions: res.currentAction,
                    filters: res.filters
                });
            }
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

    async updateSelectedActions() {
        this.state.selectedActions = Array.from(this.elements.actionInputs)
            .filter(i => i.checked)
            .map(i => i.value);
        await this.persistAndSync();
    }

    async persistAndSync() {
        // Save to storage
        await chrome.storage.local.set({
            filters: this.state.filters,
            selectedActions: this.state.selectedActions
        });

        // Sync with engine (always)
        const tab = await this.getActiveTab();
        if (tab) {
            chrome.tabs.sendMessage(tab.id, { 
                type: "UPDATE_CONFIG", 
                actions: this.state.selectedActions,
                filters: this.state.filters
            });
        }
        this.render();
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
        const { isRunning, stats, statusMessage, selectedActions, filters, isDropdownOpen } = this.state;

        if (isRunning) {
            this.elements.btnLabel.style.display = "none";
            this.elements.btnCount.style.display = "block";
            this.elements.btnCount.textContent = stats.success || 0;
            this.elements.btnPlay.classList.add("is-running");
        } else {
            this.elements.btnLabel.style.display = "block";
            this.elements.btnCount.style.display = "none";
            this.elements.btnPlay.classList.remove("is-running");
        }

        this.elements.statusLabel.textContent = statusMessage;
        
        // Render Custom Dropdown
        const currentCond = this.conditions.find(c => c.id === filters.condition) || this.conditions[0];
        this.elements.currentConditionText.textContent = currentCond.label;
        this.elements.conditionMenu.style.display = isDropdownOpen ? 'block' : 'none';
        
        this.elements.conditionMenu.innerHTML = this.conditions.map(c => `
            <div class="dropdown-item ${c.id === filters.condition ? 'active' : ''}" data-id="${c.id}">
                <span>${c.label}</span>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>
        `).join('');

        this.elements.conditionMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.onclick = async (e) => {
                e.stopPropagation();
                this.state.filters.condition = item.dataset.id;
                this.state.isDropdownOpen = false;
                await this.persistAndSync();
            };
        });

        const needsInput = !['IS_EMPTY', 'IS_NOT_EMPTY', 'NONE'].includes(filters.condition);
        this.elements.filterInputGroup.classList.toggle('hidden', !needsInput);
        this.elements.tagsDisplayWrapper.classList.toggle('hidden', !needsInput);

        const tagsJson = JSON.stringify(filters.tags);
        if (this.lastRenderedTags !== tagsJson) {
            this.elements.tagsDisplay.innerHTML = filters.tags.map((tag, i) => `
                <div class="tag ${tag.type === 'user' ? 'tag-user' : tag.type === 'hashtag' ? 'tag-hashtag' : 'tag-kw'}" data-type="${tag.type}" data-value="${tag.value}">
                    <span>${tag.type === 'user' ? '@' : tag.type === 'hashtag' ? '#' : ''}${tag.value}</span>
                    <span class="tag-remove" data-index="${i}">&times;</span>
                </div>
            `).join('');

            this.elements.tagsDisplay.querySelectorAll('.tag').forEach(tagEl => {
                const type = tagEl.dataset.type;
                const value = tagEl.dataset.value;
                const removeBtn = tagEl.querySelector('.tag-remove');

                if (type === 'user' || type === 'hashtag') {
                    tagEl.onclick = (e) => {
                        if (e.target === removeBtn) return;
                        const url = type === 'user' 
                            ? `https://www.instagram.com/${value}/`
                            : `https://www.instagram.com/explore/tags/${value}/`;
                        window.open(url, '_blank');
                    };
                }

                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.removeTag(removeBtn.dataset.index);
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
