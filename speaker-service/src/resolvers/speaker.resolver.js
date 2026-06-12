const db = require("../db/pool");

function buildSpeakerListQuery({ search, sort_by, order }) {
  const where = [];
  const params = [];
  const sortColumns = {
    name: "nama_speaker",
    institution: "instansi",
    expertise: "bidang_keahlian",
    email: "email",
    created_at: "created_at",
  };
  const sortColumn = sortColumns[sort_by] || "nama_speaker";
  const sortOrder = String(order || "").toLowerCase() === "desc" ? "DESC" : "ASC";

  if (search) {
    const keyword = `%${search}%`;
    where.push("(nama_speaker LIKE ? OR instansi LIKE ? OR bidang_keahlian LIKE ? OR email LIKE ? OR no_hp LIKE ?)");
    params.push(keyword, keyword, keyword, keyword, keyword);
  }

  const whereClause = where.length ? ` WHERE ${where.join(" AND ")}` : "";
  return {
    sql: `SELECT * FROM speakers${whereClause} ORDER BY ${sortColumn} ${sortOrder}`,
    params,
  };
}

const speakerResolvers = {
  Query: {
    hello: () => "Hello Speaker Service",

    speakers: (_, args) => {
      return new Promise((resolve, reject) => {
        const { sql, params } = buildSpeakerListQuery(args);

        db.query(sql, params, (err, results) => {
          if (err) {
            return reject(err);
          }

          resolve(results);
        });
      });
    },

    speaker: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.query("SELECT * FROM speakers WHERE id = ?", [id], (err, results) => {
          if (err) {
            return reject(err);
          }

          resolve(results[0] || null);
        });
      });
    },

    speakerAssignments: () => {
      return new Promise((resolve, reject) => {
        db.query("SELECT * FROM speaker_assignments", (err, results) => {
          if (err) {
            return reject(err);
          }

          resolve(results);
        });
      });
    },

    speakerAssignment: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM speaker_assignments WHERE id = ?",
          [id],
          (err, results) => {
            if (err) {
              return reject(err);
            }

            resolve(results[0] || null);
          }
        );
      });
    },

    speakerAssignmentsByEvent: (_, { event_id }) => {
      return new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM speaker_assignments WHERE event_id = ?",
          [event_id],
          (err, results) => {
            if (err) {
              return reject(err);
            }

            resolve(results);
          }
        );
      });
    },

    speakerAssignmentsBySpeaker: (_, { speaker_id }) => {
      return new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM speaker_assignments WHERE speaker_id = ?",
          [speaker_id],
          (err, results) => {
            if (err) {
              return reject(err);
            }

            resolve(results);
          }
        );
      });
    },
  },

  Mutation: {
    createSpeaker: (_, { input }) => {
      return new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO speakers
          (nama_speaker, instansi, bidang_keahlian, email, no_hp)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
          sql,
          [
            input.nama_speaker,
            input.instansi,
            input.bidang_keahlian,
            input.email,
            input.no_hp,
          ],
          (err, result) => {
            if (err) {
              return reject(err);
            }

            db.query(
              "SELECT * FROM speakers WHERE id = ?",
              [result.insertId],
              (err, results) => {
                if (err) {
                  return reject(err);
                }

                resolve(results[0] || null);
              }
            );
          }
        );
      });
    },

    updateSpeaker: (_, { id, input }) => {
      return new Promise((resolve, reject) => {
        const sql = `
          UPDATE speakers
          SET nama_speaker = ?, instansi = ?, bidang_keahlian = ?, email = ?, no_hp = ?
          WHERE id = ?
        `;

        db.query(
          sql,
          [
            input.nama_speaker,
            input.instansi,
            input.bidang_keahlian,
            input.email,
            input.no_hp,
            id,
          ],
          (err) => {
            if (err) {
              return reject(err);
            }

            db.query(
              "SELECT * FROM speakers WHERE id = ?",
              [id],
              (err, results) => {
                if (err) {
                  return reject(err);
                }

                resolve(results[0] || null);
              }
            );
          }
        );
      });
    },

    deleteSpeaker: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.query("DELETE FROM speakers WHERE id = ?", [id], (err, result) => {
          if (err) {
            return reject(err);
          }

          resolve(result.affectedRows > 0);
        });
      });
    },

    createSpeakerAssignment: (_, { input }) => {
      return new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO speaker_assignments
          (speaker_id, event_id, judul_materi, sesi, jam_mulai, jam_selesai)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
          sql,
          [
            input.speaker_id,
            input.event_id,
            input.judul_materi,
            input.sesi,
            input.jam_mulai,
            input.jam_selesai,
          ],
          (err, result) => {
            if (err) {
              return reject(err);
            }

            db.query(
              "SELECT * FROM speaker_assignments WHERE id = ?",
              [result.insertId],
              (err, results) => {
                if (err) {
                  return reject(err);
                }

                resolve(results[0] || null);
              }
            );
          }
        );
      });
    },

    updateSpeakerAssignment: (_, { id, input }) => {
      return new Promise((resolve, reject) => {
        const sql = `
          UPDATE speaker_assignments
          SET speaker_id = ?, event_id = ?, judul_materi = ?, sesi = ?, jam_mulai = ?, jam_selesai = ?
          WHERE id = ?
        `;

        db.query(
          sql,
          [
            input.speaker_id,
            input.event_id,
            input.judul_materi,
            input.sesi,
            input.jam_mulai,
            input.jam_selesai,
            id,
          ],
          (err) => {
            if (err) {
              return reject(err);
            }

            db.query(
              "SELECT * FROM speaker_assignments WHERE id = ?",
              [id],
              (err, results) => {
                if (err) {
                  return reject(err);
                }

                resolve(results[0] || null);
              }
            );
          }
        );
      });
    },

    deleteSpeakerAssignment: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.query(
          "DELETE FROM speaker_assignments WHERE id = ?",
          [id],
          (err, result) => {
            if (err) {
              return reject(err);
            }

            resolve(result.affectedRows > 0);
          }
        );
      });
    },
  },
};

module.exports = speakerResolvers;
