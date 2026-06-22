import { payExpense } from "../services/payment.service.js";

export const pay = async (req, res) => {
    try {
        const { walletId, amount, vendorName } = req.body;

        if (!walletId || !amount || !vendorName) {
            return res.status(400).json({
                success: false,
                message: "walletId, amount and vendorName are required",
            });
        }

        const result = await payExpense({
            walletId,
            amount,
            vendorName,
            userId: req.user.id,
            departmentId: req.user.departmentId,
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};