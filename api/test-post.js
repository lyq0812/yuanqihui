import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        if (action === 'insert_test') {
            const id = generateUUID();
            const query = `INSERT INTO properties (id, title, region, area, price, type, location, description, images, status, contact, user_id)
                          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
            const result = await sql(query, [
                id, '测试房源2', '测试区域', 100, '1.5', '标准厂房',
                '测试地址', '测试描述', '[]', 'approved', '测试联系',
                '51a78b95-cd85-433c-b4a4-3f0662735d73'
            ]);

            return new Response(JSON.stringify({
                success: true,
                result: result
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Unknown action' }), {
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
        console.log('POST /api/test-post body:', JSON.stringify(body));

        if (!body.id) {
            body.id = generateUUID();
        }

        const columns = Object.keys(body);
        const values = Object.values(body);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO properties (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        console.log('POST /api/test-post query:', query);

        const result = await sql(query, values);

        return new Response(JSON.stringify(result[0] || result), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('POST /api/test-post error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}