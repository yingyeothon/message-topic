import { APIGatewayProxyHandler } from 'aws-lambda';
import { messageApi } from './wsapi';
import { getUserRepo } from '../data/user';
import { getTopicRepo } from '../data/topic';
import { replyApi } from '../utils/ws';

export const broadcastMessage: APIGatewayProxyHandler = messageApi<{
  action: 'broadcast';
  topic: string;
  payload: any;
}>(async ({ user, message, event }) => {
  if (!message.topic || !message.payload) {
    return { statusCode: 500, body: 'No data' };
  }

  const payload =
    typeof message.payload === 'object'
      ? message.payload
      : { payload: message.payload };
  const now = Date.now();
  const payloadForMe = JSON.stringify({
    ...payload,
    _topic: message.topic,
    _now: now,
    _me: true,
  });
  const payloadForOthers = JSON.stringify({
    ...payload,
    _topic: message.topic,
    _now: now,
    _me: false,
  });

  const reply = replyApi(event);
  const errorMembers: string[] = [];
  for (const member of await getTopicRepo().getTopicMembers(message.topic)) {
    try {
      const connectionId = await getUserRepo().getConnectionIdFromUser(member);
      const me = event.requestContext.connectionId === connectionId;
      const payloadToSend = me ? payloadForMe : payloadForOthers;

      console.log(`Broadcast`, user, member, payloadToSend, connectionId);
      const sent = await reply(payloadToSend, connectionId);

      console.log(`Broadcast`, `sent`, user, member, sent);
    } catch (error) {
      console.error(`Broadcast`, `error`, member, error);
      errorMembers.push(member);
    }
  }
  await getUserRepo().kickUsers(errorMembers);
  return {
    action: 'broadcast',
    ok: true,
  };
});
