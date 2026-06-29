export const typeDefs = `#graphql
  type Reminder {
    id: ID!
    title: String!
    body: String!
    imageUrl: String!
    videoUrl: String!
    time: String!
    days: [Int!]!
    color: String!
    enabled: Boolean!
    skipDates: [String!]!
  }

  type WorkBlock {
    id: ID!
    label: String!
    start: String!
    end: String!
    workMin: Int!
    breakMin: Int!
    days: [Int!]!
    enabled: Boolean!
  }

  type Settings {
    takeoverSeconds: Int!
  }

  input ReminderInput {
    title: String!
    body: String
    imageUrl: String
    videoUrl: String
    time: String!
    days: [Int!]
    color: String
    enabled: Boolean
  }

  input WorkBlockInput {
    label: String!
    start: String!
    end: String!
    workMin: Int
    breakMin: Int
    days: [Int!]
    enabled: Boolean
  }

  type Query {
    reminders: [Reminder!]!
    workBlocks: [WorkBlock!]!
    settings: Settings!
  }

  type Mutation {
    createReminder(input: ReminderInput!): Reminder!
    updateReminder(id: ID!, input: ReminderInput!): Reminder!
    deleteReminder(id: ID!): Boolean!
    skipReminderToday(id: ID!, date: String!): Reminder!

    createWorkBlock(input: WorkBlockInput!): WorkBlock!
    updateWorkBlock(id: ID!, input: WorkBlockInput!): WorkBlock!
    deleteWorkBlock(id: ID!): Boolean!

    updateSettings(takeoverSeconds: Int!): Settings!
  }
`;
