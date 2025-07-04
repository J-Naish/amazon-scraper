import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export function buildAmazonJapanSearchUrl(searchTerms: string[]): string {
  const baseUrl = "https://amazon.co.jp";
  const encodedSearchTerms = searchTerms.map((term) => {
    return encodeURIComponent(term);
  });
  const keyword = encodedSearchTerms.join("+");
  const locale = encodeURIComponent("カタカナ");
  const sprefix = keyword;
  return `${baseUrl}/s?k=${keyword}&__mk_ja_JP=${locale}&sprefix=${sprefix}`;
}

export async function scrapeAmazonJapanSponsoredProducts(searchTerms: string[]): Promise<Array<{title: string}>> {
  console.log('スクレイピングを開始します');
  
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1366, height: 768 },
    executablePath: await chromium.executablePath(),
    headless: true,
    ignoreDefaultArgs: ['--disable-extensions'],
  });

  const page = await browser.newPage();

  // Remove automation indicators
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  // Viewport is already set in launch options

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

  const url = buildAmazonJapanSearchUrl(searchTerms);
  console.log('右記のURLに遷移します:', url);

  await page.goto(url, { waitUntil: 'networkidle2' });
  console.log('ページの読み込みに成功');

  // Simulate human behavior - scroll and wait
  console.log('スクロール動作を再現');
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

  console.log('広告商品がロードされるのを待機');
  try {
    await page.waitForSelector('span.puis-sponsored-label-info-icon', { timeout: 10000 });
    console.log('広告商品を発見');
  } catch (error) {
    // Continue even if no sponsored products found
    console.error("広告商品が見つかりませんでした");
    return [];
  }

  console.log('追加コンテンツのロードを待機');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('広告商品を抽出');
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
          const h2Element = productContainer.querySelector('h2');
          const title = h2Element ? h2Element.textContent?.trim() : '';

          products.push({
            title: title,
          });
        }
      });
    });

    return products;
  });

  await browser.close();
  console.log(`${sponsoredProducts.length}個の広告商品を取得成功`);

  return sponsoredProducts;
}

