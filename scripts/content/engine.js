/**
 * Web Automation Engine v1.1.0 - Engine Adapter
 */
class Engine {
    constructor() {
        this.master = window.master;
        this.running = false;
        this.stats = { postsProcessed: 0, actionsDone: 0 };
        this.filters = {};
        this.settings = {};

        this.injectBridge();
        this.initBridgeListener();
    }

    injectBridge() {
        try {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('scripts/content/bridge.js');
            script.onload = () => script.remove();
            (document.head || document.documentElement).appendChild(script);
        } catch (e) {}
    }

    initBridgeListener() {
        window.addEventListener("message", (event) => {
            if (event.source !== window || event.data.type !== "WAE_API_REQUEST") return;

            const { method, params } = event.data;

            switch (method) {
                case "state": console.log("📊 State:", this.master.state); break;
                case "data": console.log("💾 Database:", this.master.database.raw); break;
                case "config": console.table({ filters: this.filters, settings: this.settings }); break;
                case "start": this.start(params.actions, params.filters, params.params || {}); break;
                case "stop": this.stop(); break;
                case "get_logs": console.table(window.waeUtils.logs); break;
                case "export": this.exportData(); break;
                case "wipe": this.fullWipe().then(() => location.reload()); break;
            }
        });
    }

    async start(actions, filters, settings) {
        if (this.running) return;
        this.running = true;
        this.filters = filters;
        this.settings = settings;

        const mission = {
            targets: settings.targets || { type: 'feed', limit: 10 },
            actions: actions || ['PROCESS'],
            filters: filters || {}
        };

        try {
            await this.master.executeMission(mission);
        } catch (e) {
            console.error("❌ Mission Error:", e);
        } finally {
            this.running = false;
        }
    }

    stop() {
        this.running = false;
        this.master.stopAll();
    }

    exportData() {
        const dataToExport = this.master.database.raw.map(item => ({
            id: item.id,
            user: item.user,
            content: item.content,
            timestamp: new Date().toISOString()
        }));
        
        if (dataToExport.length === 0) {
            console.warn("⚠️ No data to export.");
            return;
        }

        waeUtils.downloadJSON(dataToExport, `wae_export_${Date.now()}.json`);
        console.log("📤 Data exported successfully.");
    }

    async fullWipe() {
        await chrome.storage.local.clear();
        this.master.database.raw = [];
    }
}

window.engine = new Engine();
