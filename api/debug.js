import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        if (action === 'migrate') {
            await sql`ALTER TABLE requests RENAME COLUMN "电话" TO phone`;
            await sql`ALTER TABLE requests RENAME COLUMN "厂房类型" TO property_type`;
            await sql`ALTER TABLE requests RENAME COLUMN "地区" TO region`;
            await sql`ALTER TABLE requests RENAME COLUMN "详细地址" TO address`;
            await sql`ALTER TABLE requests RENAME COLUMN "标题" TO title`;
            await sql`ALTER TABLE requests RENAME COLUMN "描述" TO description`;
            await sql`ALTER TABLE requests RENAME COLUMN "状态" TO status`;
            await sql`ALTER TABLE requests RENAME COLUMN "创建时间" TO created_at`;
            return new Response(JSON.stringify({ message: 'Requests table migrated' }));
        }

        if (action === 'schema') {
            const result = await sql`
                SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'requests'
            `;
            return new Response(JSON.stringify({ schema: result }));
        }

        const result = await sql`SELECT * FROM requests LIMIT 3`;
        return new Response(JSON.stringify({ count: result.length, data: result }));
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}