import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { getUserRepo } from '../data/user';
import { replyApi } from '../utils/ws';

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
    const response = await handler({
      user,
      connectionId: event.requestContext.connectionId,
      event,
    });
    if (response) {
      await replyApi(event)(
        typeof response === 'object' ? JSON.stringify(response) : response,
      );
    }
    return { statusCode: 200, body: `OK` };
  } catch (error) {
    console.error(`HandshakeApi`, `error`, user, error);
    return { statusCode: 500, body: `Failed` };
  }
};

interface Message {
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
  const user = await getUserRepo().getUserFromConnectionId(
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
    const response = await handler({
      user,
      connectionId: event.requestContext.connectionId,
      message,
      event,
    });
    console.log(`UserApi`, user, response);
    if (response) {
      await replyApi(event)(
        typeof response === 'object' ? JSON.stringify(response) : response,
      );
    }
    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    console.error(`UserApi`, user, error);
    return { statusCode: 500, body: 'Failed' };
  }
};
