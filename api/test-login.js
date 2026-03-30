import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const phone = url.searchParams.get('phone');
        const password = url.searchParams.get('password');

        if (phone && password) {
            const result = await sql`
                SELECT * FROM users WHERE phone = ${phone} OR username = ${phone} LIMIT 1
            `;

            if (result.length === 0) {
                return new Response(JSON.stringify({ error: '用户不存在' }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const user = result[0];
            const storedPassword = user.password;
            const isHashed = storedPassword && storedPassword.length === 64;

            if (isHashed) {
                return new Response(JSON.stringify({
                    type: 'hashed',
                    storedPassword: storedPassword,
                    inputPassword: password,
                    inputHashed: 'need_to_hash_client_side',
                    user: { phone: user.phone, username: user.username, user_id: user.user_id }
                }), { headers: { 'Content-Type': 'application/json' } });
            } else {
                const passwordMatch = storedPassword === password;
                return new Response(JSON.stringify({
                    type: 'plain',
                    passwordMatch: passwordMatch,
                    storedPassword: storedPassword,
                    inputPassword: password,
                    user: { phone: user.phone, username: user.username, user_id: user.user_id }
                }), { headers: { 'Content-Type': 'application/json' } });
            }
        }

        return new Response(JSON.stringify({ error: '需要 phone 和 password 参数' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}