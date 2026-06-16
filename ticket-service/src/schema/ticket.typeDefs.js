const ticketTypeDefs = `#graphql
  type TicketCategory {
    id: ID!
    event_id: ID!
    nama_tiket: String!
    harga: Int!
    kuota: Int!
    tiket_terjual: Int
    deskripsi: String
    created_at: String
    updated_at: String
  }

  input TicketCategoryInput {
    event_id: ID!
    nama_tiket: String!
    harga: Int!
    kuota: Int!
    tiket_terjual: Int
    deskripsi: String
  }

  type Query {
    ticketCategories(search: String, sort_by: String, order: String): [TicketCategory!]!
    ticketCategory(id: ID!): TicketCategory
    ticketCategoriesByEvent(event_id: ID!): [TicketCategory!]!
  }

  type Mutation {
    createTicketCategory(input: TicketCategoryInput!): TicketCategory!
    updateTicketCategory(id: ID!, input: TicketCategoryInput!): TicketCategory
    deleteTicketCategory(id: ID!): Boolean!
  }
`;

module.exports = ticketTypeDefs;
