import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const table = url.searchParams.get('table') || 'properties';
        const limit = parseInt(url.searchParams.get('limit')) || 10;

        let result;
        if (table === 'properties') {
            result = await sql`SELECT * FROM properties LIMIT ${limit}`;
        } else if (table === 'users') {
            result = await sql`SELECT * FROM users LIMIT ${limit}`;
        } else if (table === 'requests') {
            result = await sql`SELECT * FROM requests LIMIT ${limit}`;
        } else {
            return new Response(JSON.stringify({ error: 'Invalid table' }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            table,
            count: result.length,
            data: result
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        console.log('Received body:', JSON.stringify(body));

        const columns = Object.keys(body);
        const values = Object.values(body);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        console.log('Columns:', columns);
        console.log('Values:', values);
        console.log('Query:', `INSERT INTO properties (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`);

        const query = `INSERT INTO properties (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const result = await sql(query, values);

        console.log('Insert result:', JSON.stringify(result));

        return new Response(JSON.stringify(result[0] || result), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Insert error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}