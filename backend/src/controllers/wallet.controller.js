import pool from "../config/db.js";

export const getWallet = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
      SELECT
        w.id,
        w.balance,
        d.name AS department_name
      FROM wallets w
      JOIN departments d
      ON d.id = w.department_id
      WHERE w.id = $1
      `,
            [id]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getWalletTransactions = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
      SELECT
        t.id,
        t.amount,
        t.vendor_name,
        t.status,
        t.createdAt AS "createdAt",
        u.username AS paid_by
      FROM transactions t
      JOIN users u
      ON u.id = t.user_id
      WHERE t.wallet_id = $1
      ORDER BY t.createdAt DESC
      `,
            [id]
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const resetWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const { balance } = req.body;

        const newBalance = balance !== undefined ? balance : 50000;

        await pool.query(
            `
            UPDATE wallets
            SET balance = $1
            WHERE id = $2
            `,
            [newBalance, id]
        );

        // Also delete transactions for a clean simulation state
        await pool.query(
            `
            DELETE FROM transactions
            WHERE wallet_id = $1
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: `Wallet reset to ${newBalance} INR and transaction ledger cleared.`,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};