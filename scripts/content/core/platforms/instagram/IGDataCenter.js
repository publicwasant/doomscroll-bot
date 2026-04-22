/**
 * IGDataCenter - Instagram Specific Intelligence & Indexing
 */
class IGDataCenter extends BaseDataCenter {
    constructor() {
        super();
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
}
