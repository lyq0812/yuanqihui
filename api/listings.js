import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const API_KEY = process.env.API_SECRET_KEY || '';

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
            filters.push(`status = $${paramIndex++}`);
            params.push(value);
        } else if (key.startsWith('status=eq.') && value) {
            filters.push(`status = $${paramIndex++}`);
            params.push(key.split('eq.')[1]);
        } else if (key === 'id' && value) {
            filters.push(`id = $${paramIndex++}`);
            params.push(value);
        } else if (key.startsWith('id=eq.')) {
            filters.push(`id = $${paramIndex++}`);
            params.push(key.split('eq.')[1]);
        } else if (key === 'region' && value) {
            filters.push(`region = $${paramIndex++}`);
            params.push(value);
        } else if (key.startsWith('region=eq.')) {
            filters.push(`region = $${paramIndex++}`);
            params.push(decodeURIComponent(key.split('eq.')[1]));
        } else if (key === 'user_id' && value) {
            filters.push(`user_id = $${paramIndex++}`);
            params.push(value);
        } else if (key.startsWith('user_id=eq.')) {
            filters.push(`user_id = $${paramIndex++}`);
            params.push(key.split('eq.')[1]);
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
        let query = `SELECT ${safeSelect} FROM properties`;
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

        const id = body.id || 'prop_' + Date.now();
        const title = sanitizeString(body.title) || '';
        const region = sanitizeString(body.region) || '';
        const area = parseInt(body.area) || 0;
        const price = body.price || '0';
        const type = sanitizeString(body.type) || '';
        const location = sanitizeString(body.location) || '';
        const description = sanitizeString(body.description) || '';
        let images = body.images;
        if (Array.isArray(images)) {
            images = images.map(img => {
                if (!img) return null;
                if (img.startsWith('data:')) return img;
                if (img.startsWith('http')) return sanitizeString(img);
                return null;
            }).filter(img => img);
        } else if (typeof images === 'string') {
            if (images.startsWith('data:') || images.startsWith('http')) {
                images = images;
            } else {
                images = sanitizeString(images);
            }
        } else {
            images = '[]';
        }
        const status = 'approved';
        const contact = sanitizeString(body.contact) || '';
        const user_id = body.user_id || '';

        const result = await sql`
            INSERT INTO properties (id, title, region, area, price, type, location, description, images, status, contact, user_id)
            VALUES (${id}, ${title}, ${region}, ${area}, ${price}, ${type}, ${location}, ${description}, ${images}, ${status}, ${contact}, ${user_id})
            RETURNING *
        `;

        return new Response(JSON.stringify(result[0] || result), {
            status: 201,
            headers: getSecurityHeaders()
        });
    } catch (error) {
        console.error('POST /api/listings error:', error.message);
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
        const allowedFields = ['title', 'region', 'area', 'price', 'type', 'location', 'description', 'images', 'contact'];
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

        const query = `UPDATE properties SET ${updateParts} WHERE id = $1 RETURNING *`;
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
                return new Response(JSON.stringify({ error: 'Unauthorized: You can only delete your own listings' }), {
                    status: 403,
                    headers: getSecurityHeaders()
                });
            }
            query = `DELETE FROM properties WHERE id = $1 AND user_id = $2 RETURNING *`;
            params = [id, userId];
        } else {
            query = `DELETE FROM properties WHERE id = $1 RETURNING *`;
            params = [id];
        }

        const result = await sql(query, params);

        if (result.length === 0) {
            return new Response(JSON.stringify({ error: 'Listing not found or unauthorized' }), {
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
