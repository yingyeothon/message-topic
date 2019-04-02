import { APIGatewayProxyHandler } from 'aws-lambda';
import { messageApi } from './wsapi';
import { getUserRepo } from '../data/user';
import { getTopicRepo } from '../data/topic';
import { replyApi } from '../utils/ws';

export const broadcastMessage: APIGatewayProxyHandler = messageApi<{
  action: 'broadcast';
  topic: string;
  payload: string;
}>(async ({ user, message, event }) => {
  if (!message.topic || !message.payload) {
    return { statusCode: 500, body: 'No data' };
  }
  const reply = replyApi(event);
  const errorMembers: string[] = [];
  for (const member of await getTopicRepo().getTopicMembers(message.topic)) {
    try {
      const connectionId = await getUserRepo().getConnectionIdFromUser(member);
      console.log(`Broadcast`, user, member, message.payload, connectionId);
      const sent = await reply(message.payload, connectionId);
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
