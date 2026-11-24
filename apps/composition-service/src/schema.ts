export const typeDefs = `
  type Monitor {
    id: ID!
    name: String!
    url: String!
    intervalSeconds: Int!
    createdAt: String!
    checks(limit: Int = 5): [Check!]!
    latestCheck: Check
  }

  type Check {
    id: ID!
    monitorId: ID!
    status: String!
    httpStatusCode: Int
    responseTimeMs: Int
    checkedAt: String!
    errorMessage: String
  }

  type Query {
    health: String!
    monitors: [Monitor!]!
    monitor(id: ID!): Monitor
  }
`;
