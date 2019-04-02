import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { header } from '../utils/header';

const adminSecret = process.env.ADMIN_SECRET;

const authorize = (event: APIGatewayProxyEvent) => {
  if (!adminSecret) {
    return;
  }
  const requestSecret = header(event.headers, 'X-Admin-Secret');
  console.log(`AdminSecret`, adminSecret, requestSecret);
  if (adminSecret !== requestSecret) {
    throw new Error('NoAuth');
  }
};

export const adminApi = (
  handler: (event: APIGatewayProxyEvent) => Promise<any>,
): APIGatewayProxyHandler => async event => {
  try {
    authorize(event);

    const result = await handler(event);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error(`Admin`, `error`, error);
    return {
      statusCode: 400,
      body: error.message + '\n' + error.stack,
    };
  }
};
