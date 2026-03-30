import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function parseFilters(queryParams) {
    const filters = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(queryParams)) {
        if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset' || key === 'page' || key === 'pageSize') continue;

        if (key === 'status' && value) {
            const statusValue = value.startsWith('eq.') ? value.substring(3) : value;
            filters.push(`status = $${paramIndex++}`);
            params.push(statusValue);
        } else if (key === 'id' && value) {
            const idValue = value.startsWith('eq.') ? value.substring(3) : value;
            filters.push(`id = $${paramIndex++}`);
            params.push(idValue);
        } else if (key === 'region' && value) {
            const regionValue = value.startsWith('eq.') ? decodeURIComponent(value.substring(3)) : decodeURIComponent(value);
            filters.push(`region = $${paramIndex++}`);
            params.push(regionValue);
        } else if (key === 'user_id' && value) {
            const userIdValue = value.startsWith('eq.') ? value.substring(3) : value;
            filters.push(`user_id = $${paramIndex++}`);
            params.push(userIdValue);
        }
    }

    return { filters, params };
}

function parseOrder(orderParam) {
    if (!orderParam) return 'created_at DESC';

    const orders = orderParam.split(',').map(o => {
        const parts = o.trim().split('.');
        const field = parts[0];
        const direction = parts[1] || 'DESC';
        return `${field} ${direction.toUpperCase()}`;
    });

    return orders.join(', ');
}

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const select = url.searchParams.get('select') || '*';
        const limit = parseInt(url.searchParams.get('limit')) || 100;
        const offset = parseInt(url.searchParams.get('offset')) || 0;
        const order = parseOrder(url.searchParams.get('order'));

        const { filters, params } = parseFilters(Object.fromEntries(url.searchParams));

        let query = `SELECT ${select} FROM properties`;
        if (filters.length > 0) {
            query += ` WHERE ${filters.join(' AND ')}`;
        }
        query += ` ORDER BY ${order}`;
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

        if (!body.id) {
            body.id = generateUUID();
        }

        const columns = Object.keys(body);
        const values = Object.values(body);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO properties (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
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

        const query = `UPDATE properties SET ${updates} WHERE id = $1 RETURNING *`;
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

export async function DELETE(request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id')?.replace('eq.', '');

        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const query = `DELETE FROM properties WHERE id = $1 RETURNING *`;
        const result = await sql(query, [id]);

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