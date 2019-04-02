import * as AWS from 'aws-sdk';
import { APIGatewayProxyEvent } from 'aws-lambda';

export const newApigwManagementApi = (event: APIGatewayProxyEvent) =>
  new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint:
      event.requestContext.domainName +
      '/' +
      (process.env.WS_URL || event.requestContext.stage),
  });

export const replyApi = (event: APIGatewayProxyEvent) => {
  const api = newApigwManagementApi(event);
  return (data: string, connectionId?: string) =>
    api
      .postToConnection({
        ConnectionId: connectionId || event.requestContext.connectionId,
        Data: data,
      })
      .promise();
};
