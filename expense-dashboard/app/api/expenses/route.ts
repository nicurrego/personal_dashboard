import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/expenses - Fetch all expenses for the current user
 * Supports query params: year, month, target, category
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse query params
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const target = searchParams.get('target');
  const category = searchParams.get('category');

  // Build query
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (year) query = query.eq('year', parseInt(year));
  if (month) query = query.eq('month', parseInt(month));
  if (target) query = query.eq('target', target);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * POST /api/expenses - Create a new expense
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate required fields
    const { year, month, date, target, category, value } = body;
    if (!year || !month || !date || !target || !category || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: year, month, date, target, category, value' },
        { status: 400 }
      );
    }

    // Insert expense
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        year: parseInt(year),
        month: parseInt(month),
        date,
        target,
        category,
        value: parseFloat(value),
        item: body.item || '',
        context: body.context || '',
        method: body.method || '',
        shop: body.shop || '',
        location: body.location || '',
        feeling: body.feeling || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Error parsing request:', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
