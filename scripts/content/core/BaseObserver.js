/**
 * Base Observer Class
 * Role: Scans the page and extracts data. Only starts when ordered by Master.
 */
class BaseObserver {
    constructor(master, name = "GenericObserver") {
        this.master = master;
        this.name = name;
        this.isActive = false;
        
        // Register itself to Master
        this.master.registerObserver(this.name, this);
    }

    /**
     * Called by Master to start a scan mission
     * @param {Object} config - Target selectors, patterns, etc.
     */
    async onCommand(config) {
        if (this.isActive) return [];
        
        console.log(`🔭 [${this.name}] Starting scan...`);
        this.isActive = true;
        
        try {
            const data = await this.performScan(config);
            this.isActive = false;
            return data;
        } catch (error) {
            console.error(`❌ [${this.name}] Scan failed:`, error);
            this.isActive = false;
            return [];
        }
    }

    /**
     * Logic to find elements on page - MUST be implemented by subclass
     */
    async performScan(config) {
        throw new Error("performScan() must be implemented by the specific platform observer.");
    }

    stop() {
        this.isActive = false;
        console.log(`🔭 [${this.name}] Scan stopped.`);
    }

    // Utility for subclasses to wait for elements
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);

            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    resolve(el);
                    observer.disconnect();
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for ${selector}`));
            }, timeout);
        });
    }
}

window.BaseObserver = BaseObserver;