import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const API_KEY = process.env.API_SECRET_KEY || '';

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>'"&]/g, function(match) {
        const entities = {
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#x27;',
            '"': '&quot;',
            '&': '&amp;'
        };
        return entities[match] || match;
    });
}

function getSecurityHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    };
}

function verifyApiKey(request) {
    if (!API_KEY) return true;
    const authHeader = request.headers.get('x-api-key');
    return authHeader === API_KEY;
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
            filters.push(`user_id = $${paramIndex++}`);
            params.push(idValue);
        } else if (key === 'user_id' && value) {
            const userIdValue = value.startsWith('eq.') ? value.substring(3) : value;
            filters.push(`user_id = $${paramIndex++}`);
            params.push(userIdValue);
        } else if (key === 'username' && value) {
            const usernameValue = value.startsWith('eq.') ? value.substring(3) : value;
            filters.push(`username = $${paramIndex++}`);
            params.push(decodeURIComponent(usernameValue));
        } else if (key === 'phone' && value) {
            const phoneValue = value.startsWith('eq.') ? value.substring(3) : value;
            filters.push(`phone = $${paramIndex++}`);
            params.push(decodeURIComponent(phoneValue));
        }
    }

    return { filters, params };
}

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const select = url.searchParams.get('select') || '*';
        const limit = Math.min(parseInt(url.searchParams.get('limit')) || 100, 1000);
        const offset = parseInt(url.searchParams.get('offset')) || 0;

        const { filters, params } = parseFilters(Object.fromEntries(url.searchParams));

        const safeSelect = select.replace(/[^a-zA-Z0-9_,.*]/g, '');
        let query = `SELECT ${safeSelect} FROM users`;
        if (filters.length > 0) {
            query += ` WHERE ${filters.join(' AND ')}`;
        }
        query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const result = await sql(query, params);

        return new Response(JSON.stringify(result), {
            headers: getSecurityHeaders()
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: getSecurityHeaders()
        });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();

        const user_id = body.id || body.user_id || generateUUID();
        const username = sanitizeString(body.username) || '';
        const phone = sanitizeString(body.phone) || '';
        const password = body.password || '';
        const created_at = body.created_at || new Date().toISOString();

        const result = await sql`
            INSERT INTO users (user_id, username, phone, password, created_at)
            VALUES (${user_id}, ${username}, ${phone}, ${password}, ${created_at})
            RETURNING *
        `;

        return new Response(JSON.stringify(result[0] || result), {
            status: 201,
            headers: getSecurityHeaders()
        });
    } catch (error) {
        console.error('POST /api/users error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: getSecurityHeaders()
        });
    }
}

export async function PATCH(request) {
    try {
        const url = new URL(request.url);
        const user_id = url.searchParams.get('user_id')?.replace('eq.', '') || url.searchParams.get('id')?.replace('eq.', '');
        const body = await request.json();

        if (!user_id) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), {
                status: 400,
                headers: getSecurityHeaders()
            });
        }

        const safeUpdates = {};
        for (const [key, value] of Object.entries(body)) {
            if (key !== 'user_id' && key !== 'id' && key !== 'password') {
                safeUpdates[sanitizeString(key)] = typeof value === 'string' ? sanitizeString(value) : value;
            }
        }

        if (body.password) {
            safeUpdates.password = body.password;
        }

        const updates = Object.entries(safeUpdates)
            .map(([key, _], i) => `${key} = $${i + 2}`)
            .join(', ');

        if (!updates) {
            return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
                status: 400,
                headers: getSecurityHeaders()
            });
        }

        const query = `UPDATE users SET ${updates} WHERE user_id = $1 RETURNING *`;
        const values = [user_id, ...Object.values(safeUpdates)];
        const result = await sql(query, values);

        return new Response(JSON.stringify(result[0] || result), {
            headers: getSecurityHeaders()
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: getSecurityHeaders()
        });
    }
}