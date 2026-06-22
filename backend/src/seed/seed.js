import pool from "../config/db.js";

export const seed = async () => {
    try {
        await pool.query(`
      INSERT INTO departments(name)
      VALUES
      ('Engineering'),
      ('Finance'),
      ('HR'),
      ('Operations')
      ON CONFLICT (name) DO NOTHING
    `);

        await pool.query(`
      INSERT INTO wallets(department_id, balance)
      VALUES
      (1,50000),
      (2,50000),
      (3,50000),
      (4,50000)
    `);

        console.log("Seed completed");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seed();