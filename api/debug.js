import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const table = url.searchParams.get('table') || 'properties';
        const fix = url.searchParams.get('fix');

        let result;
        if (fix === 'status') {
            result = await sql`UPDATE properties SET status = 'approved' WHERE status = '出租中' OR status = '出售中' OR status = '租售中' RETURNING *`;
            return new Response(JSON.stringify({
                message: 'Status values updated',
                updated_count: result.length,
                data: result
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (table === 'properties') {
            result = await sql`SELECT * FROM properties LIMIT 5`;
        } else if (table === 'users') {
            result = await sql`SELECT * FROM users LIMIT 5`;
        } else if (table === 'requests') {
            result = await sql`SELECT * FROM requests LIMIT 5`;
        } else {
            return new Response(JSON.stringify({ error: 'Invalid table' }), {
                status: 400,
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