import { APIGatewayProxyHandler } from 'aws-lambda';
import { handshakeApi } from './wsapi';
import { getUserRepo } from '../data/user';
import { replyApi } from '../utils/ws';

export const connect: APIGatewayProxyHandler = handshakeApi(
  async ({ user, connectionId, event }) => {
    console.log(`UserHello`, `Event`, user, JSON.stringify(event, null, 2));

    const hello = await getUserRepo().userHello(user, connectionId);
    console.log(`UserHello`, user, hello);
  },
);

export const disconnect: APIGatewayProxyHandler = handshakeApi(
  async ({ user, connectionId, event }) => {
    console.log(`UserBye`, `Event`, user, JSON.stringify(event, null, 2));

    const bye = await getUserRepo().userBye(user, connectionId);
    console.log(`UserBye`, user, bye);
  },
);

export const defaultMessages: APIGatewayProxyHandler = async event => {
  console.log(`event`, JSON.stringify(event, null, 2));

  await replyApi(event)('Hi, there!');
  return { statusCode: 200, body: 'Data sent.' };
};
