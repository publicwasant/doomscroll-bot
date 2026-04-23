/**
 * Instagram Scout (Observer) v1.0.6 - Improved Data Scan & Captions
 */
class IGObserver extends BaseObserver {
    constructor(master) {
        super(master, "IGObserver");
    }

    async performScan(config) {
        waeUtils.log("OBSERVER", "Initiating refined scan on Instagram Feed...");
        
        await waeUtils.sleep(1500);

        let postElements = document.querySelectorAll('article');
        if (postElements.length === 0) {
            postElements = document.querySelectorAll('div[role="menuitem"], div._ab8w._ab94._ab99._ab9f._ab9m._ab9p._abcm');
        }

        const results = [];
        const limit = config?.limit || 10;

        for (const post of postElements) {
            if (results.length >= limit) break;
            try {
                // 1. Find Post Link
                const linkEl = post.querySelector('a[href*="/p/"], a[href*="/reels/"]');
                if (!linkEl) continue;

                // 2. Find Username
                const userEl = post.querySelector('header a[role="link"], div._aacl._aaco._aacw._aacx._aad7._aade a, a[href^="/"]');
                let username = 'unknown';
                if (userEl) {
                    username = userEl.innerText.split('\n')[0].trim();
                } else {
                    const profileImg = post.querySelector('header img');
                    if (profileImg && profileImg.alt) {
                        username = profileImg.alt.replace("'s profile picture", "").replace("รูปโปรไฟล์ของ ", "");
                    }
                }

                // 3. Find Media Link (Exclude profile pictures)
                // We look specifically for images inside the post content area, not header
                const contentArea = post.querySelector('div._aagv, div._aast, div._acay, div._aato');
                const imgEl = (contentArea || post).querySelector('img[src*="fbcdn"]:not([alt*="profile"]), video');
                const mediaUrl = imgEl ? (imgEl.tagName === 'IMG' ? imgEl.src : 'video_content') : 'unknown';

                // 4. Find Caption (More robust selectors)
                // IG captions are usually in a span inside a div with class _a9zs or similar
                // Or look for the first span that contains text after the header
                const captionSelectors = [
                    'div._a9zs span', 
                    'span._ap30', 
                    'div._aa6z span',
                    'h1', // Some posts use h1 for caption
                    'div[role="button"] span'
                ];
                
                let captionText = "";
                for (let selector of captionSelectors) {
                    const el = post.querySelector(selector);
                    if (el && el.innerText.trim().length > 0) {
                        captionText = el.innerText.trim();
                        break;
                    }
                }

                // If still empty, try finding any span that is likely the caption (long text)
                if (!captionText) {
                    const spans = post.querySelectorAll('span');
                    for (let span of spans) {
                        if (span.innerText.length > 20 && !span.querySelector('svg')) {
                            captionText = span.innerText.trim();
                            break;
                        }
                    }
                }

                results.push({
                    id: linkEl.getAttribute('href'),
                    user: username,
                    element: post,
                    valid: true,
                    content: {
                        link: mediaUrl,
                        caption: captionText
                    }
                });
                
            } catch (e) {
                // Silently skip
            }
        }

        waeUtils.log("OBSERVER", `Discovery complete. Found ${results.length} posts.`);
        return results;
    }
}

if (window.master) {
    new IGObserver(window.master);
}
