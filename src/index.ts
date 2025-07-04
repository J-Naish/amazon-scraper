import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());


function generateUrl(searchWords: string[]): string {

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
  const browser = await puppeteer.launch({
    headless: true,
    devtools: false,
    args: [
      '--lang=ja-JP',
      '--accept-lang=ja-JP',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  // Remove automation indicators
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  // Set viewport to mimic a real browser
  await page.setViewport({ width: 1366, height: 768 });

  const requestHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Content-Language": "ja-JP",
    "Accept-Language": "ja-JP,ja;q=1.0",
    "Referer": "https://www.amazon.co.jp/",
    "Cache-Control": "no-cache",
    "Cookie": "i18n-prefs=JPY; lc-main=ja_JP"
  };

  await page.setExtraHTTPHeaders({...requestHeaders});

  const url = generateUrl(["化粧水", "美白"]);

  await page.goto(url, { waitUntil: 'networkidle2' });

  // Simulate human behavior - scroll and wait
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight / 4);
  });
  await new Promise(resolve => setTimeout(resolve, 1000));

  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight / 2);
  });
  await new Promise(resolve => setTimeout(resolve, 1000));

  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    await page.waitForSelector('span.puis-sponsored-label-info-icon', { timeout: 10000 });
  } catch (error) {
    // Continue even if no sponsored products found
    console.error("広告商品が見つかりませんでした。");
    return [];
  }

  await new Promise(resolve => setTimeout(resolve, 5000));

  const sponsoredProducts = await page.evaluate(() => {
    const products: any[] = [];

    const sponsoredSelectors = [
      'span.puis-sponsored-label-info-icon',
      'a.puis-label-popover.puis-sponsored-label-text',
      'span.sponsored-brand-label-info-desktop',
      'span.puis-sponsored-label-text'
    ];

    sponsoredSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el: Element) => {
        const productContainer = el.closest('div[data-cy="title-recipe"]') || 
                                el.closest('[data-cy="title-recipe"]') ||
                                el.closest('div[role="listitem"]')?.querySelector('[data-cy="title-recipe"]');

        if (productContainer && !products.some(p => p.innerHTML === productContainer.innerHTML)) {
          products.push({
            text: productContainer.textContent?.trim(),
            innerHTML: productContainer.innerHTML
          });
        }
      });
    });

    return products;
  });

  await browser.close();

  return sponsoredProducts;
}

main().then(sponsoredProducts => {
  console.log(`Found ${sponsoredProducts.length} sponsored products`);
  sponsoredProducts.forEach((product, index) => {
    console.log(`${index + 1}. ${product.text}`);
  });
}).catch(console.error);
