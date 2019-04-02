import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import fetch from 'node-fetch';
import { headerApi, userApi } from './wsapi';
import { getUserRepo } from '../data/user';
import { replyApi } from '../utils/ws';
import { printPromiseIgnoreError } from '../utils/inspect';
import { header } from '../utils/header';

const authUrl = process.env.AUTH_URL;
const authenticate = async (event: APIGatewayProxyEvent) => {
  if (!authUrl) {
    return;
  }
  const authToken = header(event.headers, 'X-Auth-Token');
  const auth = await printPromiseIgnoreError(`Auth`, authToken)(
    fetch(authUrl, {
      method: 'post',
      headers: {
        'X-Auth-Token': authToken,
      },
    }).then<boolean>(r => r.json()),
  );
  if (!auth) {
    throw new Error('Invalid Auth');
  }
};

export const connect: APIGatewayProxyHandler = headerApi(
  async ({ user, connectionId, event }) => {
    await authenticate(event);
    console.log(`UserHello`, `Event`, user, JSON.stringify(event, null, 2));

    const hello = await getUserRepo().userHello(user, connectionId);
    console.log(`UserHello`, user, hello);
  },
);

export const disconnect: APIGatewayProxyHandler = userApi(
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
