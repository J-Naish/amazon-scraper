const { scrapeSponsored } = require('./dist/handler');

// Mock event for testing
const testEvent = {
  queryStringParameters: {
    q: '化粧水,美白'
  },
  httpMethod: 'GET',
  headers: {},
  body: null,
  isBase64Encoded: false
};

// Mock context
const testContext = {
  getRemainingTimeInMillis: () => 300000,
  functionName: 'scrapeSponsored',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:scrapeSponsored',
  memoryLimitInMB: '1024',
  awsRequestId: 'test-request-id'
};

async function testLambda() {
  console.log('Testing Lambda function locally...');
  
  try {
    const result = await scrapeSponsored(testEvent, testContext);
    console.log('Status Code:', result.statusCode);
    console.log('Response:', JSON.parse(result.body));
  } catch (error) {
    console.error('Error:', error);
  }
}

testLambda();