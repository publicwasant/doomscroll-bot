/**
 * Professional Core Bot Engine v1.2.1
 */

const SELECTORS = {
    tiles: 'a[href*="/p/"], a[href*="/reel/"]',
    closeBtn: 'svg[aria-label="Close"], svg[aria-label="ปิด"]',
    article: 'article[role="presentation"], article',
    postOwner: 'header a[href^="/"][role="link"]',
    caption: 'div[dir="auto"]'
};

class DoomscrollEngine {
    constructor() {
        this.running = false;
        this.currentActions = [];
        this.filters = {
            tags: [], 
            mode: 'EXCLUDE' 
        };
        this.processedLinks = new Set();
        this.observedUsers = new Set();
        this.stats = { done: 0, success: 0, posts: 0, reels: 0, fail: 0 };
        
        this.initObserver();
    }

    initObserver() {
        const scan = () => {
            const links = document.querySelectorAll('a[href^="/"]');
            links.forEach(link => {
                const path = link.getAttribute('href');
                const parts = path.split('/').filter(p => p);
                if (parts.length === 1) {
                    const username = parts[0];
                    const reserved = ['explore', 'reels', 'p', 'reel', 'stories', 'direct', 'accounts', 'emails', 'legal', 'privacy', 'explore', 'about', 'help', 'api', 'press', 'terms', 'directory'];
                    if (!reserved.includes(username) && !username.includes('?')) {
                        this.addObservedUser(username);
                    }
                }
            });
        };
        setInterval(scan, 3000);
        scan();
    }

    async addObservedUser(username) {
        if (!this.observedUsers.has(username)) {
            this.observedUsers.add(username);
            const { observedList = [] } = await chrome.storage.local.get("observedList");
            if (!observedList.includes(username)) {
                const newList = [username, ...observedList].slice(0, 100); 
                await chrome.storage.local.set({ observedList: newList });
            }
        }
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
        const root = document.querySelector(SELECTORS.article) || document;

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

    getPostData() {
        const article = document.querySelector(SELECTORS.article);
        if (!article) return { owner: "someone", caption: "" };
        
        const userLink = article.querySelector(SELECTORS.postOwner);
        const owner = userLink ? userLink.getAttribute('href').split('/').filter(p => p)[0] : "someone";
        
        const captionEl = article.querySelector(SELECTORS.caption);
        const caption = captionEl ? captionEl.innerText : "";

        return { owner, caption };
    }

    shouldProcessPost(data) {
        if (this.filters.tags.length === 0) return true;

        const hasKeywordMatch = this.filters.tags
            .filter(t => t.type === 'keyword')
            .some(t => data.caption.toLowerCase().includes(t.value.toLowerCase()));
        
        const hasUserMatch = this.filters.tags
            .filter(t => t.type === 'user')
            .some(t => t.value.toLowerCase() === data.owner.toLowerCase());

        const isMatched = hasKeywordMatch || hasUserMatch;

        if (this.filters.mode === 'ONLY_MATCH') {
            return isMatched;
        } else {
            return !isMatched; 
        }
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
        this.updateUI("Analyzing target...");
        
        await humanClick(tile, this.running);
        await sleep(rand(1000, 1500));

        const postData = this.getPostData();
        
        if (!this.shouldProcessPost(postData)) {
            this.updateUI(`Filtering: Skipping @${postData.owner}`);
            await sleep(500);
            await this.closePost();
            this.processedLinks.add(href);
            return true; 
        }

        const viewing = [`Targeting @${postData.owner}`, `Scanning @${postData.owner}'s ${type}`, `Evaluating interaction with @${postData.owner}`];
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
                const rewriteMsgs = [`Erased trace from @${postData.owner}`, `Redacted interaction with @${postData.owner}`, `Successfully cleared @${postData.owner}`, `@${postData.owner}'s history rewritten` ];
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

        await this.closePost();

        this.stats.done++;
        this.processedLinks.add(href);
        this.updateUI();

        await sleep(rand(1000, 1800));
    }

    async closePost() {
        const close = document.querySelector(SELECTORS.closeBtn);
        if (close) await humanClick(close, this.running);
        else window.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'Escape' }));
    }

    async start(actions, filters) {
        if (this.running) return;
        if (!isSupportedPage()) {
            this.updateUI("Unsupported page. Navigate to Explore or Profile.");
            return;
        }

        this.running = true;
        this.currentActions = actions;
        this.filters = filters || this.filters;
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

    updateConfig(actions, filters) {
        this.currentActions = actions || this.currentActions;
        this.filters = filters || this.filters;
    }
}

window.engine = new DoomscrollEngine();
