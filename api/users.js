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

        if (key === 'or' && value) {
            const orMatch = value.match(/\(([^)]+)\)/);
            if (orMatch) {
                const conditions = orMatch[1].split(',');
                const orClauses = [];
                for (const cond of conditions) {
                    const parts = cond.split('.eq.');
                    if (parts.length === 2) {
                        const field = parts[0].trim();
                        const fieldValue = parts[1].trim();
                        orClauses.push(`${field} = $${paramIndex++}`);
                        params.push(decodeURIComponent(fieldValue));
                    }
                }
                if (orClauses.length > 0) {
                    filters.push(`(${orClauses.join(' OR ')})`);
                }
            }
        } else if (key === 'id' && value) {
            const idValue = value.startsWith('eq.') ? value.substring(3) : value;
            filters.push(`id = $${paramIndex++}`);
            params.push(idValue);
        } else if (key === 'username' && value) {
            const usernameValue = value.startsWith('eq.') ? value.substring(3) : value;
            filters.push(`username = $${paramIndex++}`);
            params.push(decodeURIComponent(usernameValue));
        } else if (key === 'phone' && value) {
            const phoneValue = value.startsWith('eq.') ? value.substring(3) : value;
            filters.push(`phone = $${paramIndex++}`);
            params.push(decodeURIComponent(phoneValue));
        } else if (key === 'user_id' && value) {
            const userIdValue = value.startsWith('eq.') ? value.substring(3) : value;
            filters.push(`user_id = $${paramIndex++}`);
            params.push(userIdValue);
        } else if (key === 'status' && value) {
            const statusValue = value.startsWith('eq.') ? value.substring(3) : value;
            filters.push(`status = $${paramIndex++}`);
            params.push(statusValue);
        }
    }

    return { filters, params };
}

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const select = url.searchParams.get('select') || '*';
        const limit = parseInt(url.searchParams.get('limit')) || 100;
        const offset = parseInt(url.searchParams.get('offset')) || 0;

        const { filters, params } = parseFilters(Object.fromEntries(url.searchParams));

        let query = `SELECT ${select} FROM users`;
        if (filters.length > 0) {
            query += ` WHERE ${filters.join(' AND ')}`;
        }
        query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

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

        const id = body.id || body.user_id || generateUUID();
        const username = body.username || '';
        const phone = body.phone || '';
        const password = body.password || '';
        const role = body.role || 'user';
        const created_at = body.created_at || new Date().toISOString();

        const result = await sql`
            INSERT INTO users (id, username, phone, password, role, created_at)
            VALUES (${id}, ${username}, ${phone}, ${password}, ${role}, ${created_at})
            RETURNING *
        `;

        return new Response(JSON.stringify(result[0] || result), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('POST /api/users error:', error.message);
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