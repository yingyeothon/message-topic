export const asRedisKey = {
  userConnection: (id: string) => `__user_conn__${id}`,
  connectionUser: (id: string) => `__conn_user__${id}`,
  userTopic: (topic: string) => `__user_topic__${topic}`,
  topic: (topic: string) => `__topic__${topic},`,
};
