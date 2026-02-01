import { NextResponse } from 'next/server';

/**
 * GET /api/health - Health check endpoint
 * Used for connectivity checks by the offline module
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
}

export async function HEAD() {
    return new NextResponse(null, { status: 200 });
}
