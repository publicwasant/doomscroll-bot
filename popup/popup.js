/**
 * Doomscroll Bot - Professional MVVM v2.3.6 (Fixed Activities & Condition Dropdown)
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
            filters: { tags: [], condition: 'NONE' },
            settings: { speedMultiplier: 1.0 },
            isDropdownOpen: false,
            isSettingsOpen: false,
            suggestions: [],
            selectedSuggestIdx: -1
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
            btnSettings: document.getElementById("btnSettings"),
            settingsMenu: document.getElementById("settingsMenu"),
            btnExport: document.getElementById("btnExport"),
            btnReset: document.getElementById("btnReset"),
            speedSlider: document.getElementById("speedSlider"),
            conditionTrigger: document.getElementById("conditionTrigger"),
            conditionMenu: document.getElementById("conditionMenu"),
            currentConditionText: document.getElementById("currentConditionText")
        };

        this.lastTagsHash = "";
        this.init();
    }

    async init() {
        // Version
        try { this.elements.versionLabel.textContent = chrome.runtime.getManifest().version; this.elements.versionContainer.style.display = 'flex'; } catch (e) {}

        // Load Storage
        const saved = await chrome.storage.local.get(["filters", "selectedActions", "settings"]);
        if (saved.filters) this.state.filters = saved.filters;
        if (saved.selectedActions) this.state.selectedActions = saved.selectedActions;
        if (saved.settings) this.state.settings = saved.settings;

        // 1. Fix Activities Selection
        this.elements.actionInputs.forEach(input => {
            input.checked = this.state.selectedActions.includes(input.value);
            // Use 'click' instead of 'change' to ensure immediate state sync
            input.addEventListener('click', (e) => {
                this.state.selectedActions = Array.from(this.elements.actionInputs)
                    .filter(i => i.checked).map(i => i.value);
                this.persistAndSync();
            });
        });

        // 2. Speed Slider
        if (this.elements.speedSlider) {
            this.elements.speedSlider.value = this.state.settings.speedMultiplier;
            this.elements.speedSlider.oninput = () => {
                this.state.settings.speedMultiplier = parseFloat(this.elements.speedSlider.value);
                this.persistAndSync();
            };
        }

        this.elements.btnPlay.onclick = () => this.toggleWorkflow();

        // 3. Dropdowns Toggle
        this.elements.btnSettings.onclick = (e) => {
            e.stopPropagation();
            this.state.isSettingsOpen = !this.state.isSettingsOpen;
            this.state.isDropdownOpen = false;
            this.render();
        };

        this.elements.conditionTrigger.onclick = (e) => {
            e.stopPropagation();
            this.state.isDropdownOpen = !this.state.isDropdownOpen;
            this.state.isSettingsOpen = false;
            this.render();
        };

        this.elements.btnReset.onclick = () => this.factoryReset();
        this.elements.btnExport.onclick = () => this.exportData();

        this.initFilterInput();
        this.initDragToScroll();
        
        document.addEventListener('click', () => {
            this.state.isDropdownOpen = false;
            this.state.isSettingsOpen = false;
            this.render();
        });

        chrome.runtime.onMessage.addListener((msg) => {
            if (msg.type === "STATS_UPDATE") {
                this.state.stats = msg.stats;
                this.state.isRunning = msg.running;
                this.state.statusMessage = msg.msg || this.state.statusMessage;
                this.render();
            }
        });

        this.render();
        this.fetchCurrentState();
    }

    async persistAndSync() {
        await chrome.storage.local.set({ filters: this.state.filters, selectedActions: this.state.selectedActions, settings: this.state.settings });
        const tab = await this.getActiveTab();
        if (tab) {
            chrome.tabs.sendMessage(tab.id, { type: "UPDATE_CONFIG", actions: this.state.selectedActions, filters: this.state.filters, settings: this.state.settings });
        }
    }

    async exportData() {
        const tab = await this.getActiveTab();
        if (tab) chrome.tabs.sendMessage(tab.id, { type: "EXPORT_DATA" });
        this.state.isSettingsOpen = false;
        this.render();
    }

    async factoryReset() {
        const tab = await this.getActiveTab();
        if (tab) chrome.tabs.sendMessage(tab.id, { type: "FULL_WIPE_RELOAD" });
        window.close();
    }

    initFilterInput() {
        const input = this.elements.filterInput;
        input.oninput = async () => {
            const val = input.value.trim().toLowerCase();
            if (!val) { this.hideSuggestions(); return; }
            const data = await chrome.storage.local.get(["all_user", "all_hashtag"]);
            
            let pool = [];
            if (val.startsWith('@')) pool = (data.all_user || []).filter(u => u.includes(val.slice(1))).map(u => ({ type: 'user', value: u }));
            else if (val.startsWith('#')) pool = (data.all_hashtag || []).filter(h => h.includes(val.slice(1))).map(h => ({ type: 'hashtag', value: h }));
            else {
                const uMatch = (data.all_user || []).filter(u => u.includes(val)).map(u => ({ type: 'user', value: u }));
                const hMatch = (data.all_hashtag || []).filter(h => h.includes(val)).map(h => ({ type: 'hashtag', value: h }));
                pool = [...uMatch, ...hMatch];
            }
            this.state.suggestions = pool.slice(0, 15);
            this.state.selectedSuggestIdx = -1;
            this.renderSuggestions();
        };

        input.onkeydown = (e) => {
            if (this.state.suggestions.length > 0) {
                if (e.key === "ArrowDown") { e.preventDefault(); this.state.selectedSuggestIdx = Math.min(this.state.selectedSuggestIdx + 1, this.state.suggestions.length - 1); this.renderSuggestions(); return; }
                if (e.key === "ArrowUp") { e.preventDefault(); this.state.selectedSuggestIdx = Math.max(this.state.selectedSuggestIdx - 1, 0); this.renderSuggestions(); return; }
                if (e.key === "Enter" && this.state.selectedSuggestIdx >= 0) { e.preventDefault(); const s = this.state.suggestions[this.state.selectedSuggestIdx]; this.addTag(s.type, s.value); return; }
            }
            if (e.key === "Enter" && input.value.trim()) {
                const v = input.value.trim();
                if (v.startsWith('@')) this.addTag('user', v.slice(1)); else if (v.startsWith('#')) this.addTag('hashtag', v.slice(1)); else this.addTag('keyword', v);
            }
        };
    }

    renderSuggestions() {
        const box = this.elements.suggestionBox;
        if (this.state.suggestions.length === 0) { this.hideSuggestions(); return; }
        box.innerHTML = this.state.suggestions.map((s, i) => `
            <div class="suggestion-item ${i === this.state.selectedSuggestIdx ? 'selected' : ''}" data-index="${i}">
                <span>${s.type === 'user' ? '@' : s.type === 'hashtag' ? '#' : ''}<b>${s.value}</b></span>
            </div>
        `).join('');
        box.style.display = "block";
        const sel = box.querySelector('.suggestion-item.selected');
        if (sel) sel.scrollIntoView({ block: 'nearest' });
        box.querySelectorAll('.suggestion-item').forEach(el => { el.onclick = () => this.addTag(this.state.suggestions[el.dataset.index].type, this.state.suggestions[el.dataset.index].value); });
    }

    hideSuggestions() { this.state.suggestions = []; this.elements.suggestionBox.style.display = "none"; }

    async addTag(type, value) {
        if (!value) return;
        if (!this.state.filters.tags.some(t => t.type === type && t.value === value)) { this.state.filters.tags.push({ type, value }); await this.persistAndSync(); }
        this.elements.filterInput.value = "";
        this.hideSuggestions();
        this.render();
    }

    async removeTag(index) { this.state.filters.tags.splice(index, 1); await this.persistAndSync(); this.render(); }

    async toggleWorkflow() {
        const tab = await this.getActiveTab(); if (!tab) return;
        if (!this.state.isRunning) { this.state.isRunning = true; chrome.tabs.sendMessage(tab.id, { type: "START", actions: this.state.selectedActions, filters: this.state.filters, settings: this.state.settings }); }
        else { this.state.isRunning = false; chrome.tabs.sendMessage(tab.id, { type: "STOP" }); }
        this.render();
    }

    async fetchCurrentState() {
        const tab = await this.getActiveTab(); if (!tab || !tab.url?.includes("instagram.com")) return;
        chrome.tabs.sendMessage(tab.id, { type: "GET_STATE" }, (res) => {
            if (chrome.runtime.lastError || !res) return;
            this.state.isRunning = res.running; this.state.stats = res.stats; this.render();
        });
    }

    async getActiveTab() { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); return t; }
    initDragToScroll() {
        const s = this.elements.tagsDisplay;
        let isDown = false; let startX; let scrollLeft;
        s.addEventListener('mousedown', (e) => { isDown = true; startX = e.pageX - s.offsetLeft; scrollLeft = s.scrollLeft; });
        s.addEventListener('mouseleave', () => isDown = false);
        s.addEventListener('mouseup', () => isDown = false);
        s.addEventListener('mousemove', (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - s.offsetLeft; s.scrollLeft = scrollLeft - (x - startX) * 2; });
    }

    render() {
        const { isRunning, stats, statusMessage, filters, isDropdownOpen, isSettingsOpen } = this.state;
        
        // Update Labels
        this.elements.btnLabel.style.display = isRunning ? "none" : "block";
        this.elements.btnCount.style.display = isRunning ? "block" : "none";
        this.elements.btnCount.textContent = stats.success || 0;
        this.elements.btnPlay.classList.toggle("is-running", isRunning);
        this.elements.statusLabel.textContent = isRunning ? statusMessage : "System Standby";
        
        // Menus Visibility
        this.elements.settingsMenu.style.display = isSettingsOpen ? 'block' : 'none';
        this.elements.conditionMenu.style.display = isDropdownOpen ? 'block' : 'none';
        
        // 4. Condition Dropdown Rendering & Event Binding
        const currentCond = this.conditions.find(c => c.id === filters.condition) || this.conditions[0];
        this.elements.currentConditionText.textContent = currentCond.label;
        this.elements.conditionMenu.innerHTML = this.conditions.map(c => `
            <div class="dropdown-item ${c.id === filters.condition ? 'active' : ''}" data-id="${c.id}">${c.label}</div>
        `).join('');

        this.elements.conditionMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                this.state.filters.condition = item.dataset.id;
                this.state.isDropdownOpen = false;
                this.persistAndSync();
                this.render(); // Force re-render to update inputs visibility
            };
        });

        // Toggle Filter UI
        const needsInput = !['IS_EMPTY', 'IS_NOT_EMPTY', 'NONE'].includes(filters.condition);
        this.elements.filterInputGroup.classList.toggle('hidden', !needsInput);
        this.elements.tagsDisplayWrapper.classList.toggle('hidden', !needsInput);
        
        // Tags
        const tagsHtml = filters.tags.map((tag, i) => `
            <div class="tag ${tag.type !== 'keyword' ? 'clickable' : ''}" data-index="${i}">
                <span>${tag.type === 'user' ? '@' : tag.type === 'hashtag' ? '#' : ''}${tag.value}</span>
                <span class="tag-remove" data-index="${i}">&times;</span>
            </div>
        `).join('');
        
        if (this.lastTagsHash !== tagsHtml) {
            this.elements.tagsDisplay.innerHTML = tagsHtml;
            this.elements.tagsDisplay.querySelectorAll('.tag').forEach(tagEl => {
                const idx = tagEl.dataset.index;
                const tag = filters.tags[idx];
                const removeBtn = tagEl.querySelector('.tag-remove');
                tagEl.onclick = (e) => {
                    if (e.target === removeBtn) { e.stopPropagation(); this.removeTag(idx); }
                    else if (tag.type === 'user') window.open(`https://instagram.com/${tag.value}`, '_blank');
                    else if (tag.type === 'hashtag') window.open(`https://instagram.com/explore/tags/${tag.value}`, '_blank');
                };
            });
            this.lastTagsHash = tagsHtml;
        }
    }
}
document.addEventListener('DOMContentLoaded', () => { new PopupViewModel(); });
