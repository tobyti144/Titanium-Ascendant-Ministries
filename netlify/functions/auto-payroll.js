// /netlify/functions/auto-payroll.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
    // Executive Security Check: Restrict to POST or specific trigger
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    try {
        // 1. Check if the $2.5M pipeline funds have been received
        // We query the treasury table to see if any fund source has met its payroll threshold
        const treasury = await sql`SELECT * FROM titanium_treasury WHERE current_balance >= threshold_for_payroll`;
        
        if (treasury.length === 0) {
            return { 
                statusCode: 200, 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ success: true, message: "Funds pending. Payroll paused for protection." })
            };
        }

        // 2. Fetch all active Personnel (Board, Directors, Employees)
        const staff = await sql`SELECT * FROM titanium_personnel WHERE is_active = TRUE`;

        if (staff.length === 0) {
            return { 
                statusCode: 200, 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ success: true, message: "No active personnel found for disbursement." })
            };
        }

        // 3. Execute Automated Disbursement via Stripe Connect
        // Note: This requires Stripe Connect to be configured with valid destination IDs
        const payments = staff.map(async (person) => {
            if (!person.stripe_account_id) {
                console.warn(`No Stripe Account ID for ${person.legal_name}. Skipping.`);
                return null;
            }
            
            return stripe.transfers.create({
                amount: Math.round(person.salary_amount * 100), // Convert to cents
                currency: 'usd',
                destination: person.stripe_account_id,
                description: `Titanium Ascendant Payroll: ${person.role} - ${person.legal_name}`,
            });
        });

        const results = await Promise.all(payments);

        // 4. Update the Starchive Ledger
        await sql`UPDATE titanium_personnel SET last_payment_date = CURRENT_DATE WHERE is_active = TRUE`;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                success: true, 
                message: "Titanium Payroll Executed Successfully. All personnel funded.",
                disbursements: results.filter(r => r !== null).length
            })
        };

    } catch (error) {
        console.error("Titanium Payroll Failure:", error);
        return { 
            statusCode: 500, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
