// /netlify/functions/get-post.js

const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
    // Executive Security Check: Restrict to POST requests if receiving data
    const method = event.httpMethod;
    
    try {
        // Initializes the secure connection using your hidden environment variable
        // In this environment, we use process.env.NETLIFY_DATABASE_URL
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        
        if (method === 'GET') {
            // Example: Retrieving the latest Starchive broadcast logs or volunteer entries
            const result = await sql`SELECT * FROM starchive_logs ORDER BY created_at DESC LIMIT 10`;
            
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ success: true, data: result })
            };
        } 
        
        if (method === 'POST') {
            // Example: Receiving new volunteer or grant application data
            const body = JSON.parse(event.body);
            
            // Note: This is a boilerplate insertion. Adjust 'starchive_logs' to your specific table.
            // For the volunteer_intake table:
            if (body.type === 'volunteer_intake') {
                const insertResult = await sql`
                    INSERT INTO volunteer_intake (full_name, email_address, skills_offered) 
                    VALUES (${body.data.full_name}, ${body.data.email_address}, ${body.data.skills_offered})
                    RETURNING id, created_at
                `;
                return {
                    statusCode: 201,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ success: true, message: "Titanium Database Updated.", record: insertResult })
                };
            }

            if (body.type === 'equipment_manifest') {
                const insertResult = await sql`
                    INSERT INTO equipment_manifest (item_name, serial_number, purchase_value, ucc_lien_active) 
                    VALUES (${body.data.item_name}, ${body.data.serial_number}, ${body.data.purchase_value}, ${body.data.ucc_lien_active})
                    RETURNING id, created_at
                `;
                return {
                    statusCode: 201,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ success: true, message: "Studio Inventory Updated.", record: insertResult })
                };
            }

            // Generic insertion for other types
            const insertResult = await sql`
                INSERT INTO starchive_logs (entry_type, payload) 
                VALUES (${body.type}, ${JSON.stringify(body.data)})
                RETURNING id, created_at
            `;

            return {
                statusCode: 201,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ success: true, message: "Titanium Database Updated.", record: insertResult })
            };
        }

        // Method Not Allowed Fallback
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "HTTP Method not allowed by Titanium Security Protocols." })
        };

    } catch (error) {
        console.error("Starchive Database Link Failure:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: "Internal Server Error. Connection to Neon DB failed." })
        };
    }
};
