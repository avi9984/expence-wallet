import pool from "./src/config/db.js";
import { payExpense } from "./src/services/payment.service.js";

async function runTests() {
    console.log("=== Starting Concurrency Tests ===");

    // Step 1: Clean up and initialize database state for testing
    // We will use Wallet ID 1 (Engineering) and User ID 1 (Engineering)
    const walletId = 1;
    const userId = 1;

    try {
        // Ensure wallet 1 exists
        const walletCheck = await pool.query("SELECT * FROM wallets WHERE id = $1", [walletId]);
        if (walletCheck.rows.length === 0) {
            console.error("Test Wallet with ID 1 does not exist. Please run seed script first.");
            process.exit(1);
        }

        // Delete existing transactions for wallet 1 to have a clean slate
        await pool.query("DELETE FROM transactions WHERE wallet_id = $1", [walletId]);

        // ==========================================
        // SCENARIO 1: High-Volume Valid Case
        // Wallet balance = 50,000 INR
        // 10 concurrent requests of 500 INR each
        // Expected: All 10 succeed, balance = 45,000 INR
        // ==========================================
        console.log("\n--- Scenario 1: High-Volume Valid Case ---");
        
        // Reset balance to 50000
        await pool.query("UPDATE wallets SET balance = 50000.00 WHERE id = $1", [walletId]);
        console.log("Reset wallet balance to 50,000.00 INR");

        // Submit 10 requests concurrently
        const requests = Array.from({ length: 10 }).map((_, i) => 
            payExpense({
                walletId,
                userId,
                amount: 500,
                vendorName: `Vendor-S1-${i + 1}`,
                departmentId: 1
            })
        );

        console.log("Firing 10 payment requests of 500 INR each concurrently...");
        const results = await Promise.all(requests);

        // Verify results
        let successCount = 0;
        let failureCount = 0;
        
        results.forEach((res, index) => {
            if (res.success) {
                successCount++;
            } else {
                failureCount++;
                console.log(`Request ${index + 1} failed:`, res.message);
            }
        });

        // Fetch final wallet balance and transactions from DB
        const finalWalletRes = await pool.query("SELECT balance FROM wallets WHERE id = $1", [walletId]);
        const finalBalance = Number(finalWalletRes.rows[0].balance);
        const txCountRes = await pool.query("SELECT COUNT(*) FROM transactions WHERE wallet_id = $1", [walletId]);
        const txCount = Number(txCountRes.rows[0].count);

        console.log(`Results: ${successCount} succeeded, ${failureCount} failed.`);
        console.log(`Final balance in Database: ${finalBalance} INR`);
        console.log(`Total transactions in Database: ${txCount}`);

        const scenario1Passed = (successCount === 10 && finalBalance === 45000 && txCount === 10);
        if (scenario1Passed) {
            console.log("✅ Scenario 1 PASSED!");
        } else {
            console.error("❌ Scenario 1 FAILED!");
        }

        // ==========================================
        // SCENARIO 2: Edge Case (Insufficient Funds)
        // Wallet balance = 2,000 INR
        // 2 concurrent requests of 1,500 INR each
        // Expected: 1 succeeds, 1 fails, balance = 500 INR
        // ==========================================
        console.log("\n--- Scenario 2: Edge Case (Insufficient Funds) ---");

        // Reset balance to 2000
        await pool.query("UPDATE wallets SET balance = 2000.00 WHERE id = $1", [walletId]);
        // Clear transactions
        await pool.query("DELETE FROM transactions WHERE wallet_id = $1", [walletId]);
        console.log("Reset wallet balance to 2,000.00 INR");

        // Submit 2 requests concurrently
        console.log("Firing 2 payment requests of 1,500 INR each concurrently...");
        const s2Requests = [
            payExpense({ walletId, userId, amount: 1500, vendorName: "Vendor-S2-1", departmentId: 1 }),
            payExpense({ walletId, userId, amount: 1500, vendorName: "Vendor-S2-2", departmentId: 1 })
        ];

        const s2Results = await Promise.all(s2Requests);

        // Verify results
        let s2SuccessCount = 0;
        let s2FailureCount = 0;
        let s2FailureMessages = [];

        s2Results.forEach((res) => {
            if (res.success) {
                s2SuccessCount++;
            } else {
                s2FailureCount++;
                s2FailureMessages.push(res.message);
            }
        });

        // Fetch final wallet balance and transactions from DB
        const s2FinalWalletRes = await pool.query("SELECT balance FROM wallets WHERE id = $1", [walletId]);
        const s2FinalBalance = Number(s2FinalWalletRes.rows[0].balance);
        const s2TxCountRes = await pool.query("SELECT COUNT(*) FROM transactions WHERE wallet_id = $1", [walletId]);
        const s2TxCount = Number(s2TxCountRes.rows[0].count);

        console.log(`Results: ${s2SuccessCount} succeeded, ${s2FailureCount} failed.`);
        console.log(`Failure reasons: ${s2FailureMessages.join(", ")}`);
        console.log(`Final balance in Database: ${s2FinalBalance} INR`);
        console.log(`Total transactions in Database: ${s2TxCount}`);

        const scenario2Passed = (s2SuccessCount === 1 && s2FailureCount === 1 && s2FinalBalance === 500 && s2TxCount === 1 && s2FailureMessages.includes("Insufficient funds"));
        if (scenario2Passed) {
            console.log("✅ Scenario 2 PASSED!");
        } else {
            console.error("❌ Scenario 2 FAILED!");
        }

        if (scenario1Passed && scenario2Passed) {
            console.log("\n🎉 ALL CONCURRENCY TESTS PASSED SUCCESSFULLY! The backend logic is solid.");
        } else {
            console.error("\n⚠️ Concurrency test failures encountered.");
        }

    } catch (err) {
        console.error("Error during test execution:", err);
    } finally {
        // Close DB pool
        await pool.end();
        console.log("\n=== Test Finished. Pool closed. ===");
    }
}

runTests();
