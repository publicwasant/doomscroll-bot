/**
 * Thread 1: Data Center
 * Responsibility: Master Data Storage, Persistence, and Indexing
 */
class DataCenter {
    constructor() {
        this.posts = new Map(); // href -> {href, user, caption, status}
        this.errorStack = [];
    }

    async load() {
        const data = await chrome.storage.local.get(['all_posts', 'all_errors']);
        if (data.all_posts) {
            data.all_posts.forEach(p => this.posts.set(p.href, p));
        }
        if (data.all_errors) this.errorStack = data.all_errors;
        console.log("[DataCenter] Initialized with", this.posts.size, "posts");
    }

    async sync() {
        const allPosts = Array.from(this.posts.values()).slice(-500);
        const userSet = new Set();
        const hashSet = new Set();
        const hashtagRegex = /#([a-zA-Z0-9_ก-๙]+)/g;

        allPosts.forEach(p => {
            if (p.user) userSet.add(p.user.toLowerCase());
            if (p.caption) {
                let match;
                while ((match = hashtagRegex.exec(p.caption)) !== null) {
                    hashSet.add(match[1].toLowerCase());
                }
            }
        });

        await chrome.storage.local.set({ 
            all_posts: allPosts,
            all_user: Array.from(userSet).slice(0, 500),
            all_hashtag: Array.from(hashSet).slice(0, 500)
        });
    }

    getPost(href) {
        return this.posts.get(href);
    }

    updatePost(href, data) {
        const post = this.posts.get(href) || { href };
        Object.assign(post, data);
        this.posts.set(href, post);
        this.sync(); // Auto-sync on update
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

    async wipe() {
        await chrome.storage.local.clear();
        this.posts.clear();
        this.errorStack = [];
    }
}
