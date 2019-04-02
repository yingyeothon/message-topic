import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { getUserRepo } from '../data/user';
import { replyApi } from '../utils/ws';
import { header } from '../utils/header';

const getUserFromHeaders = (event: APIGatewayProxyEvent) => {
  const user = header(event.headers, 'X-WhoAmI');
  if (!user) {
    console.error(
      `getUserFromHeaders`,
      `NoUser`,
      event.requestContext.connectionId,
    );
    throw new Error('Invalid ID');
  }
  console.log(`User`, user, event.requestContext.connectionId);
  return user;
};

const getUserFromConnectionId = async (event: APIGatewayProxyEvent) => {
  const user = await getUserRepo().getUserFromConnectionId(
    event.requestContext.connectionId,
  );
  if (!user) {
    console.error(
      `getUserFromConnectionId`,
      `NoUser`,
      event.requestContext.connectionId,
    );
    throw new Error('Invalid ID');
  }
  console.log(`User`, event.requestContext.connectionId, user);
  return user;
};

interface Message {
  action: string;
}

const getMessageFromEvent = <M extends Message>(
  event: APIGatewayProxyEvent,
) => {
  const message: M = JSON.parse(event.body);
  if (!message || !message.action) {
    throw new Error(`Invalid Message`);
  }
  return message;
};

const executeHandler = async (
  event: APIGatewayProxyEvent,
  handler: () => Promise<any>,
) => {
  try {
    const response = await handler();
    if (response) {
      await replyApi(event)(
        typeof response === 'object' ? JSON.stringify(response) : response,
      );
    }
    return { statusCode: 200, body: `OK` };
  } catch (error) {
    console.error(`executeHandler`, `error`, error);
    return { statusCode: 500, body: error.message };
  }
};

interface HandlerArgs {
  user: string;
  connectionId: string;
  event: APIGatewayProxyEvent;
}

export const headerApi = (
  handler: (args: HandlerArgs) => Promise<any>,
): APIGatewayProxyHandler => async event =>
  executeHandler(event, () =>
    handler({
      user: getUserFromHeaders(event),
      connectionId: event.requestContext.connectionId,
      event,
    }),
  );

export const userApi = (
  handler: (args: HandlerArgs) => Promise<any>,
): APIGatewayProxyHandler => async event =>
  executeHandler(event, async () =>
    handler({
      user: await getUserFromConnectionId(event),
      connectionId: event.requestContext.connectionId,
      event,
    }),
  );

interface MessageHandlerArgs<M extends Message> extends HandlerArgs {
  message: M;
}

export const messageApi = <M extends Message>(
  handler: (args: MessageHandlerArgs<M>) => Promise<any>,
): APIGatewayProxyHandler => async event =>
  executeHandler(event, async () =>
    handler({
      user: await getUserFromConnectionId(event),
      connectionId: event.requestContext.connectionId,
      event,
      message: getMessageFromEvent(event),
    }),
  );
