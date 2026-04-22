/**
 * Thread 2: Observer
 * Responsibility: Real-time DOM Scanning & Post Discovery
 */
class Observer {
    constructor(dataCenter, instructor) {
        this.dataCenter = dataCenter;
        this.instructor = instructor;
        this.discoverySet = new Set();
        this.selectors = {
            tiles: 'a[href*="/p/"], a[href*="/reel/"]',
            postOwner: 'header a[href^="/"][role="link"], span > a[href^="/"][role="link"]',
            realCaption: 'article div[dir="auto"] > span, article h1'
        };
    }

    start() {
        this.scan(document.body);
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) this.scan(node);
                });
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        console.log("[Observer] Active");
    }

    scan(root) {
        const tiles = root.querySelectorAll(this.selectors.tiles);
        tiles.forEach(tile => {
            const href = tile.getAttribute('href');
            if (!href || this.discoverySet.has(href)) return;

            // Step 1: Basic extraction (Shell Discovery)
            let user = "";
            const container = tile.closest('article') || tile.parentElement;
            const userLink = container.querySelector(this.selectors.postOwner);
            if (userLink) user = userLink.getAttribute('href').split('/').filter(p => p)[0];

            // If profile page
            const pathParts = window.location.pathname.split('/').filter(p => p);
            if (pathParts.length === 1 && !['explore', 'reels'].includes(pathParts[0])) user = pathParts[0];

            const existing = this.dataCenter.getPost(href);
            if (!existing || existing.status !== 'completed') {
                this.dataCenter.updatePost(href, { user, status: 'discovered' });
                this.instructor.enqueue(href);
                this.discoverySet.add(href);
            }
        });
    }

    async fillCurrentPost(href) {
        const article = document.querySelector('article[role="presentation"], article');
        if (!article) return null;

        const capEl = article.querySelector(this.selectors.realCaption);
        const userLink = article.querySelector(this.selectors.postOwner);
        
        const user = userLink ? userLink.getAttribute('href').split('/').filter(p => p)[0] : "someone";
        const caption = capEl ? capEl.innerText.trim() : "";

        // Update Data Center with full info
        return this.dataCenter.updatePost(href, { user, caption, status: 'completed' });
    }
}
