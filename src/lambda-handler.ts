import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { scrapeAmazonJapanSponsoredProducts } from './amazon-scraper';

export const scrapeAmazonSponsoredProducts = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    // Get search words from query parameters or use default
    const searchQuery = event.queryStringParameters?.q || event.queryStringParameters?.search;
    const searchWords = searchQuery ? searchQuery.split(',').map(word => word.trim()) : ["化粧水", "美白"];

    console.log('Lambda invoked with search terms:', searchWords);

    const sponsoredProducts = await scrapeAmazonJapanSponsoredProducts(searchWords);

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
          title: product.title,
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
