import * as AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as Redis from 'redis';

const awaitable = <R>(
  work: (callback: (error?: Error | null, result?: R) => void) => any,
) =>
  new Promise<R>((resolve, reject) =>
    work((error, result) => (error ? reject(error) : resolve(result))),
  );

export const redisInfo: APIGatewayProxyHandler = async () => {
  const client = Redis.createClient({
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
  });
  const members = await awaitable<string[]>(cb => client.smembers('lobby', cb));
  return {
    statusCode: 200,
    body: JSON.stringify(members),
  };
};

export const connection: APIGatewayProxyHandler = async event => {
  const client = Redis.createClient({
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
  });
  let result = -1;
  switch (event.requestContext.eventType) {
    case 'CONNECT':
      result = await awaitable<number>(cb =>
        client.sadd('lobby', event.requestContext.connectionId, cb),
      );
      break;
    case 'DISCONNECT':
      result = await awaitable<number>(cb =>
        client.srem('lobby', event.requestContext.connectionId, cb),
      );
      break;
  }
  return {
    statusCode: 200,
    body: `OK: ${result}`,
  };
};

export const defaultMessages: APIGatewayProxyHandler = async event => {
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint:
      event.requestContext.domainName + '/' + event.requestContext.stage,
  });
  console.log(event.body);
  try {
    await apigwManagementApi
      .postToConnection({
        ConnectionId: event.requestContext.connectionId,
        Data: 'Hi, there!',
      })
      .promise();
    return { statusCode: 200, body: 'Data sent.' };
  } catch (error) {
    return { statusCode: 500, body: error.stack };
  }
};

export const sendMessage: APIGatewayProxyHandler = async event => {
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint:
      event.requestContext.domainName + '/' + event.requestContext.stage,
  });
  const data: string = JSON.parse(event.body).data || 'Hi, there!';
  try {
    await apigwManagementApi
      .postToConnection({
        ConnectionId: event.requestContext.connectionId,
        Data: data,
      })
      .promise();
    return { statusCode: 200, body: 'Data sent.' };
  } catch (error) {
    return { statusCode: 500, body: error.stack };
  }
};
