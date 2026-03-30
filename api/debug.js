import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const table = url.searchParams.get('table') || 'properties';
        const migrate = url.searchParams.get('migrate');

        if (migrate === 'users') {
            const alterResult = await sql`
                ALTER TABLE users RENAME COLUMN "电话" TO phone;
                ALTER TABLE users RENAME COLUMN "用户名" TO username;
                ALTER TABLE users RENAME COLUMN "身份证" TO user_id;
                ALTER TABLE users RENAME COLUMN "密码" TO password;
            `;
            return new Response(JSON.stringify({
                message: 'Users table columns renamed',
                details: alterResult
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (migrate === 'requests') {
            const alterResult = await sql`
                ALTER TABLE requests RENAME COLUMN "电话" TO phone;
                ALTER TABLE requests RENAME COLUMN "厂房类型" TO property_type;
                ALTER TABLE requests RENAME COLUMN "地区" TO region;
                ALTER TABLE requests RENAME COLUMN "详细地址" TO address;
                ALTER TABLE requests RENAME COLUMN "标题" TO title;
                ALTER TABLE requests RENAME COLUMN "描述" TO description;
                ALTER TABLE requests RENAME COLUMN "状态" TO status;
                ALTER TABLE requests RENAME COLUMN "创建时间" TO created_at;
            `;
            return new Response(JSON.stringify({
                message: 'Requests table columns renamed',
                details: alterResult
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let result;
        if (table === 'properties') {
            result = await sql`SELECT * FROM properties LIMIT 5`;
        } else if (table === 'users') {
            result = await sql`SELECT * FROM users LIMIT 5`;
        } else if (table === 'requests') {
            result = await sql`SELECT * FROM requests LIMIT 5`;
        } else {
            return new Response(JSON.stringify({ error: 'Invalid table' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            table,
            count: result.length,
            data: result
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}