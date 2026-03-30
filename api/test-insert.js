import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
    try {
        const body = await request.json();
        console.log('Test INSERT body:', JSON.stringify(body));

        const testData = {
            title: '测试房源',
            region: '测试区域',
            area: 100,
            price: '1.5',
            type: '标准厂房',
            location: '测试地址',
            description: '测试描述',
            images: '[]',
            status: 'approved',
            contact: '测试联系',
            user_id: '51a78b95-cd85-433c-b4a4-3f0662735d73'
        };

        const columns = Object.keys(testData);
        const values = Object.values(testData);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO properties (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        console.log('Test INSERT query:', query);
        console.log('Test INSERT values:', values);

        const result = await sql(query, values);

        return new Response(JSON.stringify({
            success: true,
            result: result
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Test INSERT error:', error.message);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}