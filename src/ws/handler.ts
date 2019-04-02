import { APIGatewayProxyHandler } from 'aws-lambda';
import redis from '../utils/redis';
import { handshakeApi, newApigwManagementApi, userApi } from './wsapi';

export const connect: APIGatewayProxyHandler = handshakeApi(
  async ({ user, connectionId }) => {
    const hello = await redis.userHello(user, connectionId);
    console.log(`UserHello`, user, hello);
  },
);

export const disconnect: APIGatewayProxyHandler = handshakeApi(
  async ({ user, connectionId }) => {
    const bye = await redis.userBye(user, connectionId);
    console.log(`UserBye`, user, bye);
  },
);

export const defaultMessages: APIGatewayProxyHandler = async event => {
  const apigwManagementApi = newApigwManagementApi(event);
  console.log(event.body);
  await apigwManagementApi
    .postToConnection({
      ConnectionId: event.requestContext.connectionId,
      Data: 'Hi, there!',
    })
    .promise();
  return { statusCode: 200, body: 'Data sent.' };
};

export const subscribeTopic: APIGatewayProxyHandler = userApi<{
  action: 'subscribe';
  topic: string;
}>(async ({ user, message }) => {
  if (!message.topic) {
    return { statusCode: 500, body: 'No topic' };
  }
  return redis.subscribeTopic(user, message.topic);
});

export const unsubscribeTopic: APIGatewayProxyHandler = userApi<{
  action: 'unsubscribe';
  topic: string;
}>(async ({ user, message }) => {
  if (!message.topic) {
    return { statusCode: 500, body: 'No topic' };
  }
  return redis.unsubscribeTopic(user, message.topic);
});

export const broadcastMessage: APIGatewayProxyHandler = userApi<{
  action: 'broadcast';
  topic: string;
  payload: string;
}>(async ({ user, message, event }) => {
  if (!message.topic || !message.payload) {
    return { statusCode: 500, body: 'No data' };
  }
  const apigwManagementApi = newApigwManagementApi(event);
  const broadcastData = JSON.stringify({
    action: message.action,
    topic: message.topic,
    payload: message.payload,
  });

  const errorMembers: string[] = [];
  for (const member of await redis.getTopicMembers(message.topic)) {
    try {
      const connectionId = await redis.getConnectionIdFromUser(member);
      console.log(`Broadcast`, user, member, broadcastData, connectionId);
      const sent = await apigwManagementApi
        .postToConnection({
          ConnectionId: connectionId,
          Data: broadcastData,
        })
        .promise();
      console.log(`Broadcast`, `sent`, user, member, sent);
    } catch (error) {
      console.error(`Broadcast`, `error`, member, error);
      errorMembers.push(member);
    }
  }
  try {
    console.log(`KickBad`, errorMembers);
    const kick = await Promise.all(errorMembers.map(redis.kickUser));
    console.log(`KickBad`, kick);
  } catch (error) {
    console.error(`KickBad`, `error`, error);
  }
});
