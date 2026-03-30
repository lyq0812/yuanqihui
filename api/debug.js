import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const table = url.searchParams.get('table') || 'users';

        if (table === 'users') {
            const result = await sql`
                SELECT column_name FROM information_schema.columns WHERE table_name = 'users'
            `;
            return new Response(JSON.stringify({ schema: result }));
        }

        return new Response(JSON.stringify({ error: 'Invalid table' }));
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}