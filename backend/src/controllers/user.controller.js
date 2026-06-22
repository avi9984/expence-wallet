import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const register = async (req, res) => {
    try {
        const { username, email, password, departmentId } = req.body;

        if (!(username && email && password && departmentId)) {
            return res.status(400).json({ status: false, message: "All input fields are required" })
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `
                INSERT INTO users
                (username,email,password,department_id)
                VALUES ($1,$2,$3,$4)
                RETURNING id,username,email
             `,
            [
                username,
                email,
                hashedPassword,
                departmentId,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Register user successfull",
            data: result.rows[0],
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            `
      SELECT *
      FROM users
      WHERE email=$1
      `,
            [email]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const user = result.rows[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                departmentId: user.department_id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        return res.json({
            success: true,
            token,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};