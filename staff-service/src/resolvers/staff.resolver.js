const db = require("../db/pool");

function buildStaffListQuery({ search, sort_by, order }) {
  const where = [];
  const params = [];
  const sortColumns = {
    name: "nama_staff",
    division: "divisi",
    email: "email",
    created_at: "created_at",
  };
  const sortColumn = sortColumns[sort_by] || "nama_staff";
  const sortOrder = String(order || "").toLowerCase() === "desc" ? "DESC" : "ASC";

  if (search) {
    const keyword = `%${search}%`;
    where.push("(nama_staff LIKE ? OR divisi LIKE ? OR no_hp LIKE ? OR email LIKE ?)");
    params.push(keyword, keyword, keyword, keyword);
  }

  const whereClause = where.length ? ` WHERE ${where.join(" AND ")}` : "";
  return {
    sql: `SELECT * FROM staffs${whereClause} ORDER BY ${sortColumn} ${sortOrder}`,
    params,
  };
}

const staffResolvers = {
  Query: {
    staffs: (_, args) => {
      return new Promise((resolve, reject) => {
        const { sql, params } = buildStaffListQuery(args);

        db.query(sql, params, (err, results) => {
          if (err) {
            return reject(err);
          }

          resolve(results);
        });
      });
    },

    staff: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.query("SELECT * FROM staffs WHERE id = ?", [id], (err, results) => {
          if (err) {
            return reject(err);
          }

          resolve(results[0] || null);
        });
      });
    },

    staffAssignments: () => {
      return new Promise((resolve, reject) => {
        db.query("SELECT * FROM staff_assignments", (err, results) => {
          if (err) {
            return reject(err);
          }

          resolve(results);
        });
      });
    },

    staffAssignment: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM staff_assignments WHERE id = ?",
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

    staffAssignmentsByEvent: (_, { event_id }) => {
      return new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM staff_assignments WHERE event_id = ?",
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

    staffAssignmentsByStaff: (_, { staff_id }) => {
      return new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM staff_assignments WHERE staff_id = ?",
          [staff_id],
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
    createStaff: (_, { input }) => {
      return new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO staffs
          (nama_staff, divisi, no_hp, email)
          VALUES (?, ?, ?, ?)
        `;

        db.query(
          sql,
          [input.nama_staff, input.divisi, input.no_hp, input.email],
          (err, result) => {
            if (err) {
              return reject(err);
            }

            db.query(
              "SELECT * FROM staffs WHERE id = ?",
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

    updateStaff: (_, { id, input }) => {
      return new Promise((resolve, reject) => {
        const sql = `
          UPDATE staffs
          SET nama_staff = ?, divisi = ?, no_hp = ?, email = ?
          WHERE id = ?
        `;

        db.query(
          sql,
          [input.nama_staff, input.divisi, input.no_hp, input.email, id],
          (err) => {
            if (err) {
              return reject(err);
            }

            db.query(
              "SELECT * FROM staffs WHERE id = ?",
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

    deleteStaff: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.query("DELETE FROM staffs WHERE id = ?", [id], (err, result) => {
          if (err) {
            return reject(err);
          }

          resolve(result.affectedRows > 0);
        });
      });
    },

    createStaffAssignment: (_, { input }) => {
      return new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO staff_assignments
          (staff_id, event_id, role_tugas, status_tugas)
          VALUES (?, ?, ?, ?)
        `;

        db.query(
          sql,
          [input.staff_id, input.event_id, input.role_tugas, input.status_tugas],
          (err, result) => {
            if (err) {
              return reject(err);
            }

            db.query(
              "SELECT * FROM staff_assignments WHERE id = ?",
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

    updateStaffAssignment: (_, { id, input }) => {
      return new Promise((resolve, reject) => {
        const sql = `
          UPDATE staff_assignments
          SET staff_id = ?, event_id = ?, role_tugas = ?, status_tugas = ?
          WHERE id = ?
        `;

        db.query(
          sql,
          [input.staff_id, input.event_id, input.role_tugas, input.status_tugas, id],
          (err) => {
            if (err) {
              return reject(err);
            }

            db.query(
              "SELECT * FROM staff_assignments WHERE id = ?",
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

    deleteStaffAssignment: (_, { id }) => {
      return new Promise((resolve, reject) => {
        db.query(
          "DELETE FROM staff_assignments WHERE id = ?",
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

module.exports = staffResolvers;
