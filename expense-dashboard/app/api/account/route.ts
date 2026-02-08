import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/account - Permanently delete the current user's account
 * This uses the admin client to delete the user from Supabase Auth
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify request body contains confirmation
    const body = await request.json().catch(() => ({}));
    if (body.confirm !== 'DELETE') {
      return NextResponse.json(
        { error: 'Please confirm deletion by sending { "confirm": "DELETE" }' },
        { status: 400 }
      );
    }

    // Use admin client to delete the user
    const adminClient = createAdminClient();

    // Delete user from auth.users (this will cascade delete all user data due to ON DELETE CASCADE)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete account: ' + deleteError.message },
        { status: 500 }
      );
    }

    // Sign out the user (clear session cookies)
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Account permanently deleted',
      clear_storage: true // Signal to client to clear localStorage
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
