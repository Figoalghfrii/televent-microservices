const db = require("../db/pool");

function buildTicketListQuery({ search, sort_by, order }) {
  const where = [];
  const params = [];
  const sortColumns = {
    name: "nama_tiket",
    price: "harga",
    quota: "kuota",
    sold: "tiket_terjual",
    created_at: "created_at",
  };
  const sortColumn = sortColumns[sort_by] || "nama_tiket";
  const sortOrder = String(order || "").toLowerCase() === "desc" ? "DESC" : "ASC";

  if (search) {
    const keyword = `%${search}%`;
    where.push("(nama_tiket LIKE ? OR deskripsi LIKE ? OR harga LIKE ? OR kuota LIKE ? OR tiket_terjual LIKE ?)");
    params.push(keyword, keyword, keyword, keyword, keyword);
  }

  const whereClause = where.length ? ` WHERE ${where.join(" AND ")}` : "";
  return {
    sql: `SELECT * FROM ticket_categories${whereClause} ORDER BY ${sortColumn} ${sortOrder}`,
    params,
  };
}

const ticketResolvers = {
  Query: {
    ticketCategories: (_, args) => {
      return new Promise((resolve, reject) => {
        const { sql, params } = buildTicketListQuery(args);

        db.query(sql, params, (err, results) => {
          if (err) {
            return reject(err);
          }

          resolve(results);
        });
      });
    },

    ticketCategory: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM ticket_categories WHERE id = ?",
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

    ticketCategoriesByEvent: (_, { event_id }) => {
      return new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM ticket_categories WHERE event_id = ?",
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
  },

  Mutation: {
    createTicketCategory: (_, { input }) => {
      return new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO ticket_categories
          (event_id, nama_tiket, harga, kuota, tiket_terjual, deskripsi)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
          sql,
          [
            input.event_id,
            input.nama_tiket,
            input.harga,
            input.kuota,
            input.tiket_terjual,
            input.deskripsi,
          ],
          (err, result) => {
            if (err) {
              return reject(err);
            }

            db.query(
              "SELECT * FROM ticket_categories WHERE id = ?",
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

    updateTicketCategory: (_, { id, input }) => {
      return new Promise((resolve, reject) => {
        const sql = `
          UPDATE ticket_categories
          SET event_id = ?, nama_tiket = ?, harga = ?, kuota = ?, tiket_terjual = ?, deskripsi = ?
          WHERE id = ?
        `;

        db.query(
          sql,
          [
            input.event_id,
            input.nama_tiket,
            input.harga,
            input.kuota,
            input.tiket_terjual,
            input.deskripsi,
            id,
          ],
          (err) => {
            if (err) {
              return reject(err);
            }

            db.query(
              "SELECT * FROM ticket_categories WHERE id = ?",
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

    deleteTicketCategory: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.query(
          "DELETE FROM ticket_categories WHERE id = ?",
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

module.exports = ticketResolvers;
