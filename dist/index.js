"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
function generateUrl(searchWords) {
    const baseUrl = "https://amazon.co.jp";
    const encodedSearchWords = searchWords.map((word) => {
        return encodeURIComponent(word);
    });
    const keyword = encodedSearchWords.join("+");
    const locale = encodeURIComponent("カタカナ");
    const sprefix = keyword;
    return `${baseUrl}/s?k=${keyword}&__mk_ja_JP=${locale}&sprefix=${sprefix}`;
}
async function main() {
    console.log('Starting Puppeteer...');
    const browser = await puppeteer_1.default.launch({
        headless: false,
        devtools: false,
        args: [
            '--lang=ja-JP',
            '--accept-lang=ja-JP',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    });
    const page = await browser.newPage();
    const requestHeaders = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Content-Language": "ja-JP",
        "Accept-Language": "ja-JP,ja;q=1.0",
        "Referer": "https://www.amazon.co.jp/",
        "Cache-Control": "no-cache",
        "Cookie": "i18n-prefs=JPY; lc-main=ja_JP"
    };
    await page.setExtraHTTPHeaders({ ...requestHeaders });
    const url = generateUrl(["化粧水", "美白"]);
    await page.goto(url, { waitUntil: 'networkidle2' });
    // Wait for sponsored products to load
    try {
        // Wait for sponsored content selectors
        await page.waitForSelector('span.puis-sponsored-label-info-icon', { timeout: 10000 });
        console.log('Sponsored products detected');
    }
    catch (error) {
        console.log('No sponsored products found or timeout reached');
    }
    // Additional wait for any lazy-loaded content
    await new Promise(resolve => setTimeout(resolve, 3000));
    // Debug: Check what sponsored product containers exist
    const sponsoredDebug = await page.evaluate(() => {
        const sponsoredElements = document.querySelectorAll('*[class*="sponsored"], *[data-*="sponsored"], span.puis-sponsored-label-info-icon');
        return Array.from(sponsoredElements).map(el => ({
            tagName: el.tagName,
            className: el.className,
            outerHTML: el.outerHTML.substring(0, 200) + '...'
        }));
    });
    console.log('Sponsored elements found:', sponsoredDebug.length);
    sponsoredDebug.forEach((item, index) => {
        console.log(`Sponsored ${index + 1}: ${item.tagName}.${item.className}`);
    });
    // Extract all products including sponsored ones
    const allProducts = await page.evaluate(() => {
        const products = [];
        // Try different selectors for sponsored products
        const sponsoredSelectors = [
            'span.puis-sponsored-label-info-icon',
            '*[class*="sponsored"]',
            '*[data-component-type*="sponsored"]'
        ];
        sponsoredSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Find the product container that contains this sponsored indicator
                const productContainer = el.closest('div[data-cy="title-recipe"]') ||
                    el.closest('[data-cy="title-recipe"]') ||
                    el.closest('div[role="listitem"]')?.querySelector('[data-cy="title-recipe"]');
                if (productContainer) {
                    products.push({
                        type: 'sponsored',
                        text: productContainer.textContent?.trim(),
                        innerHTML: productContainer.innerHTML,
                        sponsoredIndicator: el.outerHTML
                    });
                }
            });
        });
        // Regular products
        const regularProducts = document.querySelectorAll('div[role="listitem"] div[data-cy="title-recipe"]');
        regularProducts.forEach(el => {
            // Check if this is already captured as sponsored
            const isSponsored = products.some(p => p.innerHTML === el.innerHTML);
            if (!isSponsored) {
                products.push({
                    type: 'regular',
                    text: el.textContent?.trim(),
                    innerHTML: el.innerHTML
                });
            }
        });
        return products;
    });
    console.log(`\nTotal products found: ${allProducts.length}`);
    console.log(`Regular: ${allProducts.filter(p => p.type === 'regular').length}`);
    console.log(`Sponsored: ${allProducts.filter(p => p.type === 'sponsored').length}`);
    allProducts.forEach((item, index) => {
        if (index <= 12) {
            console.log(`\n--- Product ${index + 1} (${item.type.toUpperCase()}) ---`);
            console.log('Text:', item.text);
            if (item.sponsoredIndicator) {
                console.log('Sponsored indicator:', item.sponsoredIndicator.substring(0, 100) + '...');
            }
            console.log('---');
        }
    });
    await browser.close();
    console.log('Browser closed');
}
main().catch(console.error);
//# sourceMappingURL=index.js.map