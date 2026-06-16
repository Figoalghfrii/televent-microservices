const staffTypeDefs = `#graphql
  type Staff {
    id: ID!
    nama_staff: String!
    divisi: String
    no_hp: String
    email: String
    created_at: String
    updated_at: String
  }

  type StaffAssignment {
    id: ID!
    staff_id: ID!
    event_id: ID!
    role_tugas: String
    status_tugas: String
    created_at: String
  }

  input StaffInput {
    nama_staff: String!
    divisi: String
    no_hp: String
    email: String
  }

  input StaffAssignmentInput {
    staff_id: ID!
    event_id: ID!
    role_tugas: String
    status_tugas: String
  }

  type Query {
    staffs(search: String, sort_by: String, order: String): [Staff!]!
    staff(id: ID!): Staff
    staffAssignments: [StaffAssignment!]!
    staffAssignment(id: ID!): StaffAssignment
    staffAssignmentsByEvent(event_id: ID!): [StaffAssignment!]!
    staffAssignmentsByStaff(staff_id: ID!): [StaffAssignment!]!
  }

  type Mutation {
    createStaff(input: StaffInput!): Staff!
    updateStaff(id: ID!, input: StaffInput!): Staff
    deleteStaff(id: ID!): Boolean!
    createStaffAssignment(input: StaffAssignmentInput!): StaffAssignment!
    updateStaffAssignment(id: ID!, input: StaffAssignmentInput!): StaffAssignment
    deleteStaffAssignment(id: ID!): Boolean!
  }
`;

module.exports = staffTypeDefs;
