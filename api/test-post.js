import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export async function POST(request) {
    try {
        const body = await request.json();
        console.log('Test POST body:', JSON.stringify(body));

        const id = body.id || generateUUID();
        const title = body.title || 'Test';
        const region = body.region || 'Test';
        const area = body.area || 100;
        const status = body.status || 'approved';
        const user_id = body.user_id || 'test';

        const result = await sql`
            INSERT INTO properties (id, title, region, area, status, user_id)
            VALUES (${id}, ${title}, ${region}, ${area}, ${status}, ${user_id})
            RETURNING *
        `;

        return new Response(JSON.stringify(result[0] || result), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Test POST error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}