/**
 * Core Bot Engine
 */

const SELECTORS = {
    tiles: 'a[href*="/p/"], a[href*="/reel/"]',
    closeBtn: 'svg[aria-label="Close"], svg[aria-label="ปิด"]'
};

class DoomscrollEngine {
    constructor() {
        this.running = false;
        this.currentActions = [];
        this.processedLinks = new Set();
        this.stats = { done: 0, success: 0, posts: 0, reels: 0, fail: 0 };
    }

    async checkStatus() {
        if (!this.running) throw new Error("BOT_STOPPED");
    }

    updateUI(customMsg = "") {
        chrome.runtime.sendMessage({
            type: "STATS_UPDATE",
            stats: this.stats,
            msg: customMsg,
            running: this.running,
            supported: isSupportedPage()
        });
    }

    getSummary() {
        let summary = "Mission complete. History rewritten.";
        if (this.stats.success > 0) {
            const details = [];
            if (this.stats.posts > 0) details.push(`${this.stats.posts} posts`);
            if (this.stats.reels > 0) details.push(`${this.stats.reels} reels`);
            summary = `History rewritten. ${details.join(' and ')} redacted.`;
        }
        return summary;
    }

    findActionButton(action) {
        const outlets = {
            LIKE: ["Like", "Unlike", "ถูกใจ", "เลิกถูกใจ"],
            REPOST: ["Repost", "Unrepost", "รีโพสต์", "เลิกโพสต์ใหม่"],
            SAVE: ["Save", "Remove", "บันทึก", "เลิกบันทึก", "Unsave"]
        };

        const labels = outlets[action] || [];
        const article = document.querySelector('article[role="presentation"]') || document.querySelector('article');
        const root = article || document;

        if (action === 'LIKE' || action === 'REPOST') {
            const sections = root.querySelectorAll('section');
            for (const section of sections) {
                const hasLike = section.querySelector('svg[aria-label="Like"], svg[aria-label="Unlike"], svg[aria-label="ถูกใจ"], svg[aria-label="เลิกถูกใจ"]');
                if (!hasLike) continue;

                const btns = Array.from(section.querySelectorAll('[role="button"]'));
                for (const btn of btns) {
                    const svg = btn.querySelector('svg[aria-label]');
                    if (svg && labels.includes(svg.getAttribute('aria-label'))) {
                        if (!btn.closest('ul') && !btn.closest('li')) return btn;
                    }
                }
            }
        }

        if (action === 'SAVE') {
            for (const label of labels) {
                const svg = root.querySelector(`svg[aria-label="${label}"]`);
                if (svg) {
                    const btn = svg.closest('[role="button"]');
                    if (btn && !btn.closest('ul') && !btn.closest('li')) return btn;
                }
            }
        }
        return null;
    }

    getOwnerName() {
        const article = document.querySelector('article[role="presentation"]') || document.querySelector('article');
        if (!article) return "someone";
        const userLink = article.querySelector('a[href^="/"][role="link"]');
        if (userLink) {
            const name = userLink.getAttribute('href').replace(/\//g, '');
            if (name && !['explore', 'reels'].includes(name)) return name;
        }
        return "someone";
    }

    async processOne(href) {
        await this.checkStatus();

        let tile = document.querySelector(`a[href="${href}"]`);
        if (!tile) {
            const shortHref = href.split('?')[0];
            tile = document.querySelector(`a[href*="${shortHref}"]`);
        }
        if (!tile) return false;

        const isReel = href.includes('/reel/');
        const type = isReel ? "reel" : "post";

        await humanScrollTo(tile, this.running);
        const intros = ["Targeting history...", "Intercepting memory...", "Locating digital footprint...", "Rewriting this moment..."];
        this.updateUI(intros[rand(0, intros.length - 1)]);
        
        await humanClick(tile, this.running);
        await sleep(rand(1000, 1800));

        const owner = this.getOwnerName();
        const viewing = [`Analyzing @${owner}'s trace`, `Scanning @${owner}'s ${type}`, `Assessing @${owner}`, `Evaluating interaction with @${owner}`];
        this.updateUI(viewing[rand(0, viewing.length - 1)]);

        let anySuccess = false;
        for (const action of this.currentActions) {
            await this.checkStatus();
            let btn = null;
            for (let i = 0; i < 10; i++) {
                await this.checkStatus();
                btn = this.findActionButton(action);
                if (btn) break;
                await sleep(200);
            }

            if (btn && this.running) {
                await humanClick(btn, this.running);
                anySuccess = true;
                const rewriteMsgs = [`Erased trace from @${owner}`, `Redacted interaction with @${owner}`, `Successfully cleared @${owner}`, `@${owner}'s history rewritten` ];
                this.updateUI(rewriteMsgs[rand(0, rewriteMsgs.length - 1)]);
                await sleep(rand(400, 800));
            }
        }

        if (anySuccess) {
            this.stats.success++;
            if (isReel) this.stats.reels++; else this.stats.posts++;
        } else {
            this.stats.fail++;
        }

        const close = document.querySelector(SELECTORS.closeBtn);
        if (close) await humanClick(close, this.running);
        else window.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'Escape' }));

        this.stats.done++;
        this.processedLinks.add(href);
        this.updateUI();

        await sleep(rand(1200, 2200));
    }

    async start(actions) {
        if (this.running) return;
        if (!isSupportedPage()) {
            this.updateUI("Unsupported page. Navigate to Explore or Profile.");
            return;
        }

        this.running = true;
        this.currentActions = actions;
        this.processedLinks.clear();
        this.stats = { done: 0, success: 0, posts: 0, reels: 0, fail: 0 };
        
        this.updateUI("Initiating redaction protocol...");

        try {
            while (this.running) {
                await this.checkStatus();

                const tiles = Array.from(document.querySelectorAll(SELECTORS.tiles));
                const uniqueHrefs = [...new Set(tiles.map(t => t.getAttribute('href')))];
                const newHrefs = uniqueHrefs.filter(href => href && !this.processedLinks.has(href));

                if (newHrefs.length > 0) {
                    for (const href of newHrefs) {
                        await this.checkStatus();
                        await this.processOne(href);
                    }
                } else {
                    this.updateUI("Searching for more traces...");
                    const lastHeight = document.documentElement.scrollHeight;
                    window.scrollBy({ top: rand(1000, 1500), behavior: 'smooth' });
                    await sleep(rand(2000, 3000)); 
                    if (document.documentElement.scrollHeight === lastHeight) break;
                }
            }
        } catch (e) {
            console.log("Doomscroll Bot stopped.");
        } finally {
            this.running = false;
            chrome.runtime.sendMessage({ type: "WORKFLOW_COMPLETE", summary: this.getSummary() });
        }
    }

    stop() {
        this.running = false;
    }

    updateConfig(actions) {
        this.currentActions = actions || this.currentActions;
    }
}

// Export for main.js (In Extension context, global works or use modules)
window.engine = new DoomscrollEngine();
