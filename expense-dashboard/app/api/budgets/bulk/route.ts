import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { entries } = body;

        if (!entries || !Array.isArray(entries)) {
            return NextResponse.json({ error: 'Invalid entries' }, { status: 400 });
        }

        // Get unique year-month combinations from entries
        const yearMonths = [...new Set(entries.map((e: any) => `${e.year}-${e.month}`))];

        // Delete existing entries for these months
        for (const ym of yearMonths) {
            const [year, month] = ym.split('-').map(Number);
            await supabase
                .from('budgets')
                .delete()
                .eq('user_id', user.id)
                .eq('year', year)
                .eq('month', month);
        }

        // Insert new entries with user_id
        const payload = entries.map((entry: any) => ({
            ...entry,
            user_id: user.id
        }));

        const { data, error } = await supabase
            .from('budgets')
            .insert(payload)
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: data.length });
    } catch (error) {
        console.error('Bulk save error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
