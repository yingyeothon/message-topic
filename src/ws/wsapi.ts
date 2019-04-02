import * as AWS from 'aws-sdk';
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import redis from '../utils/redis';

export const handshakeApi = (
  handler: (args: {
    user: string;
    connectionId: string;
    event: APIGatewayProxyEvent;
  }) => Promise<any>,
): APIGatewayProxyHandler => async event => {
  const user = event.headers['x-whoami'];
  if (!user) {
    console.error(`HandshakeApi`, `NoUser`, event.requestContext.connectionId);
    return { statusCode: 500, body: `Invalid id` };
  }
  try {
    console.info(`HandshakeApi`, user, event.requestContext.connectionId);
    await handler({
      user,
      connectionId: event.requestContext.connectionId,
      event,
    });
    return { statusCode: 200, body: `OK` };
  } catch (error) {
    console.error(`HandshakeApi`, `error`, user, error);
    return { statusCode: 500, body: `Failed` };
  }
};

export const newApigwManagementApi = (event: APIGatewayProxyEvent) =>
  new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint:
      event.requestContext.domainName + '/' + event.requestContext.stage,
  });

export interface Message {
  action: string;
}

export const userApi = <M extends Message>(
  handler: (args: {
    user: string;
    connectionId: string;
    message: M;
    event: APIGatewayProxyEvent;
  }) => Promise<any>,
): APIGatewayProxyHandler => async event => {
  const user = await redis.getUserFromConnectionId(
    event.requestContext.connectionId,
  );
  if (!user) {
    console.error(`UserApi`, `NoUser`, event.requestContext.connectionId);
    return { statusCode: 500, body: 'Invalid id' };
  }
  const message: M = JSON.parse(event.body);
  if (!message || !message.action) {
    console.error(`UserApi`, `InvalidMessage`, user, message);
    return { statusCode: 500, body: 'Invalid message' };
  }
  try {
    console.log(`UserApi`, user, event.requestContext.connectionId, message);
    const result = await handler({
      user,
      connectionId: event.requestContext.connectionId,
      message,
      event,
    });
    console.log(`UserApi`, user, result);
    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    console.error(`UserApi`, user, error);
    return { statusCode: 500, body: 'Failed' };
  }
};
