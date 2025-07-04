import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
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

async function scrapeAmazonSponsored(searchWords: string[]) {
  console.log('Starting Amazon scraper...');
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/opt/chromium/chromium',
    args: [
      '--lang=ja-JP',
      '--accept-lang=ja-JP',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-gpu',
      '--single-process'
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

  const url = generateUrl(searchWords);
  console.log('Navigating to:', url);

  await page.goto(url, { waitUntil: 'networkidle2' });
  console.log('Page loaded successfully');

  // Simulate human behavior - scroll and wait
  console.log('Simulating human scrolling behavior...');
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

  console.log('Waiting for sponsored products to load...');
  try {
    await page.waitForSelector('span.puis-sponsored-label-info-icon', { timeout: 10000 });
    console.log('Sponsored products detected');
  } catch (error) {
    console.error("広告商品が見つかりませんでした。");
    await browser.close();
    return [];
  }

  console.log('Waiting for additional content to load...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Starting to extract sponsored products...');
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
            text: title,
            innerHTML: productContainer.innerHTML
          });
        }
      });
    });

    return products;
  });

  await browser.close();
  console.log(`Extraction completed. Found ${sponsoredProducts.length} sponsored products`);

  return sponsoredProducts;
}

export const scrapeSponsored = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    // Get search words from query parameters or use default
    const searchQuery = event.queryStringParameters?.q || event.queryStringParameters?.search;
    const searchWords = searchQuery ? searchQuery.split(',').map(word => word.trim()) : ["化粧水", "美白"];

    console.log('Lambda invoked with search terms:', searchWords);

    const sponsoredProducts = await scrapeAmazonSponsored(searchWords);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        success: true,
        searchTerms: searchWords,
        count: sponsoredProducts.length,
        products: sponsoredProducts.map(product => ({
          title: product.text,
        }))
      })
    };
  } catch (error) {
    console.error('Error in Lambda function:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to scrape Amazon sponsored products'
      })
    };
  }
};
