const speakerTypeDefs = `#graphql
  type Speaker {
    id: ID!
    nama_speaker: String!
    instansi: String
    bidang_keahlian: String
    email: String
    no_hp: String
    created_at: String
    updated_at: String
  }

  type SpeakerAssignment {
    id: ID!
    speaker_id: ID!
    event_id: ID!
    judul_materi: String
    sesi: String
    jam_mulai: String
    jam_selesai: String
    created_at: String
  }

  input SpeakerInput {
    nama_speaker: String!
    instansi: String
    bidang_keahlian: String
    email: String
    no_hp: String
  }

  input SpeakerAssignmentInput {
    speaker_id: ID!
    event_id: ID!
    judul_materi: String
    sesi: String
    jam_mulai: String
    jam_selesai: String
  }

  type Query {
    speakers(search: String, sort_by: String, order: String): [Speaker!]!
    speaker(id: ID!): Speaker
    speakerAssignments: [SpeakerAssignment!]!
    speakerAssignment(id: ID!): SpeakerAssignment
    speakerAssignmentsByEvent(event_id: ID!): [SpeakerAssignment!]!
    speakerAssignmentsBySpeaker(speaker_id: ID!): [SpeakerAssignment!]!
  }

  type Mutation {
    createSpeaker(input: SpeakerInput!): Speaker!
    updateSpeaker(id: ID!, input: SpeakerInput!): Speaker
    deleteSpeaker(id: ID!): Boolean!
    createSpeakerAssignment(input: SpeakerAssignmentInput!): SpeakerAssignment!
    updateSpeakerAssignment(id: ID!, input: SpeakerAssignmentInput!): SpeakerAssignment
    deleteSpeakerAssignment(id: ID!): Boolean!
  }
`;

module.exports = speakerTypeDefs;
