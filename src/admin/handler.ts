import { APIGatewayProxyHandler } from 'aws-lambda';
import redis from '../utils/redis';

export const seeTopicMembers: APIGatewayProxyHandler = async req => {
  const members = await redis.getTopicMembers(req.pathParameters.topic);
  return {
    statusCode: 200,
    body: JSON.stringify(members),
  };
};

export const deleteTopic: APIGatewayProxyHandler = async req => {
  const deleted = await redis.deleteTopic(req.pathParameters.topic);
  return {
    statusCode: 200,
    body: JSON.stringify(deleted),
  };
};
