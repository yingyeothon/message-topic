import { APIGatewayProxyHandler } from 'aws-lambda';
import { getTopicRepo } from '../data/topic';
import { adminApi } from './adminapi';

export const seeTopicMembers: APIGatewayProxyHandler = adminApi(async event =>
  getTopicRepo().getTopicMembers(event.pathParameters.topic),
);

export const deleteTopic: APIGatewayProxyHandler = adminApi(async event =>
  getTopicRepo().deleteTopic(event.pathParameters.topic),
);
