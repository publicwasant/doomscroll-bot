/**
 * Thread 3: Instructor
 * Responsibility: Workflow Execution, Queue Management, and Actions
 */
class Instructor {
    constructor(dataCenter) {
        this.dataCenter = dataCenter;
        this.observer = null; // Set via orchestrator
        this.queue = [];
        this.running = false;
        this.currentTarget = null;
        this.currentActions = ["LIKE"];
        this.filters = { tags: [], condition: 'NONE' };
        this.stats = { done: 0, success: 0, posts: 0, reels: 0 };
    }

    setObserver(observer) {
        this.observer = observer;
    }

    enqueue(href) {
        if (!this.queue.includes(href)) {
            this.queue.push(href);
        }
    }

    async start(actions, filters) {
        if (this.running) return;
        this.running = true;
        this.currentActions = actions;
        this.filters = filters;
        this.stats = { done: 0, success: 0, posts: 0, reels: 0 };
        
        console.log("[Instructor] Started");
        this.updateUI("Instructor: Online");

        try {
            while (this.running) {
                if (this.queue.length === 0) {
                    this.updateUI("Instructor: Queue empty, searching...");
                    window.scrollBy({ top: 1000, behavior: 'smooth' });
                    await sleep(3000);
                    continue;
                }

                const href = this.queue.shift();
                await this.executeActionWorkflow(href);
            }
        } catch (e) {
            console.log("[Instructor] Paused");
        } finally {
            this.running = false;
        }
    }

    async executeActionWorkflow(href) {
        const tile = document.querySelector(`a[href="${href}"]`);
        if (!tile) return;

        // 1. Open the post
        await humanScrollTo(tile, this.running);
        await humanClick(tile, this.running);
        await sleep(rand(2000, 3000));

        // 2. Request Observer to Fill Data
        const fullPost = await this.observer.fillCurrentPost(href);
        this.currentTarget = fullPost;

        // 3. Filter Check
        if (!this.shouldProcessPost(fullPost)) {
            this.updateUI(`Instructor: Filter skipped @${fullPost.user}`);
            await this.closePost();
            return;
        }

        // 4. Perform Actions
        this.updateUI(`Instructor: Processing @${fullPost.user}`);
        let success = false;
        for (const action of this.currentActions) {
            const btn = this.findActionButton(action);
            if (btn && this.running) {
                await humanClick(btn, this.running);
                success = true;
                await sleep(rand(800, 1500));
            }
        }

        if (success) {
            this.stats.success++;
            if (href.includes('/reel/')) this.stats.reels++; else this.stats.posts++;
        }

        // 5. Cleanup
        await this.closePost();
        this.stats.done++;
        this.currentTarget = null;
        this.updateUI();
        await sleep(rand(1000, 2000));
    }

    shouldProcessPost(post) {
        if (!post) return false;
        if (this.filters.condition === 'NONE') return true;
        
        const cap = (post.caption || "").toLowerCase();
        const user = (post.user || "").toLowerCase();
        
        const match = this.filters.tags.some(t => {
            const val = t.value.toLowerCase();
            if (t.type === 'user') return user.includes(val);
            if (t.type === 'hashtag') return cap.includes('#' + val);
            return cap.includes(val);
        });

        return this.filters.condition.includes('NOT') ? !match : match;
    }

    findActionButton(action) {
        const labels = { 
            LIKE: ["Like", "Unlike", "ถูกใจ", "เลิกถูกใจ"], 
            REPOST: ["Repost", "Unrepost", "รีโพสต์", "เลิกโพสต์ใหม่"], 
            SAVE: ["Save", "Remove", "บันทึก", "เลิกบันทึก", "Unsave"] 
        }[action];
        const btns = Array.from(document.querySelectorAll('article [role="button"]'));
        return btns.find(b => labels.includes(b.querySelector('svg')?.getAttribute('aria-label')));
    }

    async closePost() {
        const closeBtn = document.querySelector('svg[aria-label="Close"], svg[aria-label="ปิด"]');
        if (closeBtn) await humanClick(closeBtn, this.running);
        else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    }

    updateUI(msg = "") {
        chrome.runtime.sendMessage({ 
            type: "STATS_UPDATE", 
            stats: this.stats, 
            msg, 
            running: this.running, 
            filters: this.filters 
        });
    }

    stop() {
        this.running = false;
    }
}
