import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const select = url.searchParams.get('select') || '*';
        const limit = parseInt(url.searchParams.get('limit')) || 100;
        const offset = parseInt(url.searchParams.get('offset')) || 0;

        let query = `SELECT ${select} FROM users`;
        const params = [];

        const id = url.searchParams.get('id');
        if (id) {
            query += ` WHERE id = $1`;
            params.push(id.replace('eq.', ''));
        } else {
            query += ` ORDER BY created_at DESC`;
        }

        query += ` LIMIT ${limit} OFFSET ${offset}`;

        const result = await sql(query, params);

        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
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
        const columns = Object.keys(body);
        const values = Object.values(body);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const result = await sql(query, values);

        return new Response(JSON.stringify(result[0] || result), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function PATCH(request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id')?.replace('eq.', '');
        const body = await request.json();

        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const updates = Object.entries(body)
            .filter(([key]) => key !== 'id')
            .map(([key, _], i) => `${key} = $${i + 2}`)
            .join(', ');

        const query = `UPDATE users SET ${updates} WHERE id = $1 RETURNING *`;
        const values = [id, ...Object.entries(body).filter(([key]) => key !== 'id').map(([_, val]) => val)];
        const result = await sql(query, values);

        return new Response(JSON.stringify(result[0] || result), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
