import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const table = url.searchParams.get('table') || 'properties';
        const migrate = url.searchParams.get('migrate');

        if (migrate === 'users_phone') {
            await sql`ALTER TABLE users RENAME COLUMN "电话" TO phone`;
            return new Response(JSON.stringify({ message: '电话 -> phone done' }));
        }
        if (migrate === 'users_username') {
            await sql`ALTER TABLE users RENAME COLUMN "用户名" TO username`;
            return new Response(JSON.stringify({ message: '用户名 -> username done' }));
        }
        if (migrate === 'users_user_id') {
            await sql`ALTER TABLE users RENAME COLUMN "身份证" TO user_id`;
            return new Response(JSON.stringify({ message: '身份证 -> user_id done' }));
        }
        if (migrate === 'users_password') {
            await sql`ALTER TABLE users RENAME COLUMN "密码" TO password`;
            return new Response(JSON.stringify({ message: '密码 -> password done' }));
        }

        if (migrate === 'users') {
            await sql`ALTER TABLE users RENAME COLUMN "电话" TO phone`;
            await sql`ALTER TABLE users RENAME COLUMN "用户名" TO username`;
            await sql`ALTER TABLE users RENAME COLUMN "身份证" TO user_id`;
            await sql`ALTER TABLE users RENAME COLUMN "密码" TO password`;
            return new Response(JSON.stringify({ message: 'Users table migrated' }));
        }

        let result;
        if (table === 'users') {
            result = await sql`SELECT * FROM users LIMIT 3`;
        } else {
            result = await sql`SELECT * FROM properties LIMIT 3`;
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