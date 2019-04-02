import { APIGatewayProxyHandler } from 'aws-lambda';
import { getTopicRepo } from '../data/topic';

export const seeTopicMembers: APIGatewayProxyHandler = async req => {
  const members = await getTopicRepo().getTopicMembers(
    req.pathParameters.topic,
  );
  return {
    statusCode: 200,
    body: JSON.stringify(members),
  };
};

export const deleteTopic: APIGatewayProxyHandler = async req => {
  const deleted = await getTopicRepo().deleteTopic(req.pathParameters.topic);
  return {
    statusCode: 200,
    body: JSON.stringify(deleted),
  };
};
