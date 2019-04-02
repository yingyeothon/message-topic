import { APIGatewayProxyHandler } from 'aws-lambda';
import { userApi } from './wsapi';
import { getTopicRepo, TopicRepo } from '../data/topic';
import { printPromiseRethrowError } from '../utils/inspect';

export const subscribeTopic: APIGatewayProxyHandler = userApi<{
  action: 'subscribe';
  topic: string;
}>(async ({ user, message }) => {
  if (!message.topic) {
    return { statusCode: 500, body: 'No topic' };
  }
  await printPromiseRethrowError(`Subscribe`, user)(
    getTopicRepo().subscribeTopic(user, message.topic),
  );
  return {
    action: 'subscribe',
    topic: TopicRepo,
    ok: true,
  };
});

export const unsubscribeTopic: APIGatewayProxyHandler = userApi<{
  action: 'unsubscribe';
  topic: string;
}>(async ({ user, message }) => {
  if (!message.topic) {
    return { statusCode: 500, body: 'No topic' };
  }
  await printPromiseRethrowError(`Unsubscribe`, user)(
    getTopicRepo().unsubscribeTopic(user, message.topic),
  );
  return {
    action: 'unsubscribe',
    topic: TopicRepo,
    ok: true,
  };
});
