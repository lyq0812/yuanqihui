import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        if (action === 'insert_test') {
            const query = `INSERT INTO properties (title, region, area, price, type, location, description, images, status, contact, user_id)
                          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`;
            const result = await sql(query, [
                '测试房源', '测试区域', 100, '1.5', '标准厂房',
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

        if (action === 'test') {
            const query = `SELECT * FROM properties LIMIT 3`;
            const result = await sql(query);
            return new Response(JSON.stringify({
                success: true,
                data: result
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Unknown action. Use ?action=test or ?action=insert_test' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}