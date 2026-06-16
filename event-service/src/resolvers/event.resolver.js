const db = require("../db/pool");

function normalizeStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  const statuses = {
    upcoming: "Upcoming",
    ongoing: "Ongoing",
    finished: "Finished",
    completed: "Finished",
    complete: "Finished",
    cancelled: "Cancelled",
    canceled: "Cancelled",
  };

  return statuses[value] || status;
}

function buildEventListQuery({ search, status, sort_by, order }) {
  const where = [];
  const params = [];
  const sortColumns = {
    date: "tanggal",
    name: "nama_event",
    status: "status_event",
    created_at: "created_at",
  };
  const sortColumn = sortColumns[sort_by] || "tanggal";
  const sortOrder = String(order || "").toLowerCase() === "desc" ? "DESC" : "ASC";

  if (search) {
    const keyword = `%${search}%`;
    where.push("(nama_event LIKE ? OR lokasi LIKE ? OR deskripsi LIKE ? OR status_event LIKE ?)");
    params.push(keyword, keyword, keyword, keyword);
  }

  if (status) {
    const normalizedStatus = normalizeStatus(status);
    where.push("LOWER(status_event) = LOWER(?)");
    params.push(normalizedStatus);
  }

  const whereClause = where.length ? ` WHERE ${where.join(" AND ")}` : "";
  return {
    sql: `SELECT * FROM events${whereClause} ORDER BY ${sortColumn} ${sortOrder}`,
    params,
  };
}

const eventResolvers = {
  Query: {
    events: (_, args) => {
      return new Promise((resolve, reject) => {
        const { sql, params } = buildEventListQuery(args);

        db.query(sql, params, (err, results) => {
          if (err) {
            return reject(err);
          }

          resolve(results);
        });
      });
    },

    event: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM events WHERE id = ?",
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

    eventsByStatus: (_, { status_event }) => {
      return new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM events WHERE LOWER(status_event) = LOWER(?)",
          [normalizeStatus(status_event)],
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
    createEvent: (_, { input }) => {
      return new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO events
          (nama_event, tanggal, waktu, lokasi, deskripsi, status_event)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
          sql,
          [
            input.nama_event,
            input.tanggal,
            input.waktu,
            input.lokasi,
            input.deskripsi,
            normalizeStatus(input.status_event),
          ],
          (err, result) => {
            if (err) {
              return reject(err);
            }

            db.query(
              "SELECT * FROM events WHERE id = ?",
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

    updateEvent: (_, { id, input }) => {
      return new Promise((resolve, reject) => {
        const sql = `
          UPDATE events
          SET nama_event = ?, tanggal = ?, waktu = ?, lokasi = ?, deskripsi = ?, status_event = ?
          WHERE id = ?
        `;

        db.query(
          sql,
          [
            input.nama_event,
            input.tanggal,
            input.waktu,
            input.lokasi,
            input.deskripsi,
            normalizeStatus(input.status_event),
            id,
          ],
          (err) => {
            if (err) {
              return reject(err);
            }

            db.query(
              "SELECT * FROM events WHERE id = ?",
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

    deleteEvent: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.query("DELETE FROM events WHERE id = ?", [id], (err, result) => {
          if (err) {
            return reject(err);
          }

          resolve(result.affectedRows > 0);
        });
      });
    },
  },
};

module.exports = eventResolvers;
