const eventTypeDefs = `#graphql
  type Event {
    id: ID!
    nama_event: String!
    tanggal: String!
    waktu: String
    lokasi: String!
    deskripsi: String
    status_event: String!
    created_at: String
    updated_at: String
  }

  input EventInput {
    nama_event: String!
    tanggal: String!
    waktu: String
    lokasi: String!
    deskripsi: String
    status_event: String!
  }

  type Query {
    hello: String!
    events(search: String, status: String, sort_by: String, order: String): [Event!]!
    event(id: ID!): Event
    eventsByStatus(status_event: String!): [Event!]!
  }

  type Mutation {
    createEvent(input: EventInput!): Event!
    updateEvent(id: ID!, input: EventInput!): Event
    deleteEvent(id: ID!): Boolean!
  }
`;

module.exports = eventTypeDefs;
