import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

function getSecurityHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    };
}

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const table = url.searchParams.get('table') || 'users';

        if (table === 'users') {
            const result = await sql`
                SELECT column_name FROM information_schema.columns WHERE table_name = 'users'
            `;
            return new Response(JSON.stringify({ schema: result }), {
                headers: getSecurityHeaders()
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid table' }), {
            status: 400,
            headers: getSecurityHeaders()
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: getSecurityHeaders()
        });
    }
}
