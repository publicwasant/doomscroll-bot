/**
 * BaseDataCenter - แม่แบบหลักสำหรับการจัดการข้อมูล (Storage & Persistence)
 */
class BaseDataCenter {
    constructor() {
        this.posts = new Map(); 
        this.errorStack = [];    
    }

    async load() {
        const data = await chrome.storage.local.get(['all_posts', 'all_errors']);
        // Clear RAM before loading to ensure clean state
        this.posts.clear();
        if (data.all_posts) data.all_posts.forEach(p => this.posts.set(p.href, p));
        if (data.all_errors) this.errorStack = data.all_errors;
    }

    async sync() { 
        throw new Error("Method 'sync()' must be implemented by subclass."); 
    }

    getPost(href) { 
        return this.posts.get(href); 
    }

    updatePost(href, data) {
        const post = this.posts.get(href) || { href };
        Object.assign(post, data); 
        this.posts.set(href, post);
        this.sync(); 
        return post;
    }

    async logError(err, context) {
        this.errorStack.unshift({ 
            time: new Date().toISOString(), 
            context, 
            msg: err.message || err 
        });
        this.errorStack = this.errorStack.slice(0, 100);
        await chrome.storage.local.set({ all_errors: this.errorStack });
    }

    /**
     * ล้างข้อมูลทุกอย่างแบบขุดรากถอนโคน
     */
    async wipe() {
        this.posts.clear();
        this.errorStack = [];
        await chrome.storage.local.clear();
        console.log("[DataCenter] Full wipe complete.");
    }
}
