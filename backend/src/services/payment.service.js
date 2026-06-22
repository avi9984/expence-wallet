import pool from "../config/db.js";

export const payExpense = async ({
    walletId, userId, amount, vendorName, departmentId
}) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const walletResult = await client.query(`
            SELECT *
            FROM wallets
            WHERE id = $1 AND department_id = $2
            FOR UPDATE
            `,
            [walletId, departmentId]
        );
        const wallet = walletResult.rows[0];

        if (!wallet) {
            throw new Error("Wallet not found or unauthorized access");
        }

        if (Number(wallet.balance) < Number(amount)) {
            await client.query("ROLLBACK");

            return {
                success: false,
                message: "Insufficient funds",
            };
        }

        const updateWallet = await client.query(
            `
            UPDATE wallets
            SET balance = balance - $1
            WHERE id= $2
            RETURNING *
            `,
            [amount, walletId]
        );

        const transcation = await client.query(
            `
            INSERT INTO transactions
            (
            wallet_id,
            user_id,
            amount,
            vendor_name,
            status
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                walletId,
                userId,
                amount,
                vendorName,
                "SUCCESS"
            ]
        );
        await client.query("COMMIT");
        return {
            success: true,
            message: "Assign balance to department",
            wallet: updateWallet.rows[0],
            transcation: transcation.rows[0]
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }finally{
        client.release();
    }
}