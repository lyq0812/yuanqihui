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
        const limit = Math.min(parseInt(url.searchParams.get('limit')) || 100, 1000);
        const offset = parseInt(url.searchParams.get('offset')) || 0;
        const order = parseOrder(url.searchParams.get('order'));

        const { filters, params } = parseFilters(Object.fromEntries(url.searchParams));

        const safeSelect = select.replace(/[^a-zA-Z0-9_,.*]/g, '');
        let query = `SELECT ${safeSelect} FROM requests`;
        if (filters.length > 0) {
            query += ` WHERE ${filters.join(' AND ')}`;
        }
        query += ` ORDER BY ${order}`;
        query += ` LIMIT ${limit} OFFSET ${offset}`;

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

        const id = body.id || generateUUID();
        const title = sanitizeString(body.title) || '';
        const username = sanitizeString(body.username) || body.name || '';
        const contact = sanitizeString(body.contact) || '';
        const user_phone = sanitizeString(body.user_phone) || body.phone || '';
        const area = parseInt(body.area) || 0;
        const budget = body.budget || '0';
        const type = sanitizeString(body.type) || '';
        const location = sanitizeString(body.location) || '';
        const description = sanitizeString(body.description) || '';
        const status = 'approved';
        let images = body.images;
        if (Array.isArray(images)) {
            images = images.filter(img => img && (img.startsWith('data:') || img.startsWith('http')));
        } else if (typeof images === 'string') {
            if (!images.startsWith('data:') && !images.startsWith('http')) {
                images = null;
            }
        } else {
            images = null;
        }

        const result = await sql(
            `INSERT INTO requests (id, title, username, contact, user_phone, area, budget, type, location, description, status, images)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [id, title, username, contact, user_phone, area, budget, type, location, description, status, images]
        );

        return new Response(JSON.stringify(result[0] || result), {
            status: 201,
            headers: getSecurityHeaders()
        });
    } catch (error) {
        console.error('POST /api/requests error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: getSecurityHeaders()
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
                headers: getSecurityHeaders()
            });
        }

        const updates = {};
        const allowedFields = ['title', 'username', 'contact', 'user_phone', 'area', 'budget', 'type', 'location', 'description', 'images'];
        for (const [key, value] of Object.entries(body)) {
            if (allowedFields.includes(key)) {
                if (key === 'images' && Array.isArray(value)) {
                    updates[key] = value.map(img => sanitizeString(img)).filter(img => img && img.startsWith('http'));
                } else if (typeof value === 'string') {
                    updates[key] = sanitizeString(value);
                } else {
                    updates[key] = value;
                }
            }
        }

        const updateParts = Object.entries(updates)
            .map(([key, _], i) => `${key} = $${i + 2}`)
            .join(', ');

        if (!updateParts) {
            return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
                status: 400,
                headers: getSecurityHeaders()
            });
        }

        const query = `UPDATE requests SET ${updateParts} WHERE id = $1 RETURNING *`;
        const values = [id, ...Object.values(updates)];
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

export async function DELETE(request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id')?.replace('eq.', '');
        const userId = url.searchParams.get('user_id')?.replace('eq.', '');
        const requestingUserId = url.searchParams.get('requesting_user_id')?.replace('eq.', '');

        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required' }), {
                status: 400,
                headers: getSecurityHeaders()
            });
        }

        let query;
        let params;

        if (userId && requestingUserId) {
            if (userId !== requestingUserId) {
                return new Response(JSON.stringify({ error: 'Unauthorized: You can only delete your own requests' }), {
                    status: 403,
                    headers: getSecurityHeaders()
                });
            }
            query = `DELETE FROM requests WHERE id = $1 AND user_id = $2 RETURNING *`;
            params = [id, userId];
        } else {
            query = `DELETE FROM requests WHERE id = $1 RETURNING *`;
            params = [id];
        }

        const result = await sql(query, params);

        if (result.length === 0) {
            return new Response(JSON.stringify({ error: 'Request not found or unauthorized' }), {
                status: 404,
                headers: getSecurityHeaders()
            });
        }

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