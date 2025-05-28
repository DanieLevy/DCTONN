import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest, canManageUsers, hashPassword } from '@/lib/auth';
import { loadUsers, saveUsers } from '@/lib/data-store';
import { User } from '@/lib/types';

// GET individual user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Admin API] GET individual user request received');
    
    const token = getTokenFromRequest(request);
    const payload = verifyToken(token || '');
    
    if (!payload || !canManageUsers(payload)) {
      console.log('[Admin API] Unauthorized request - admin access required');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { users } = await loadUsers();
    
    const user = users.find(u => u.id === id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password hash from response
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      location: user.location,
      permissions: user.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: safeUser,
    });

  } catch (error: any) {
    console.error('[Admin API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Admin API] PUT update user request received');
    
    const token = getTokenFromRequest(request);
    const payload = verifyToken(token || '');
    
    if (!payload || !canManageUsers(payload)) {
      console.log('[Admin API] Unauthorized request - admin access required');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const updateData = await request.json();
    const { username, email, password, role, location, permissions } = updateData;

    const { users, locations } = await loadUsers();
    
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const existingUser = users[userIndex];

    // Prevent admin from demoting themselves
    if (existingUser.id === payload.userId && existingUser.role === 'admin' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own admin role' },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role && !['admin', 'data_manager', 'viewer'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Validate location if provided
    if (location && !['EU', 'USA', 'IL'].includes(location)) {
      return NextResponse.json(
        { success: false, error: 'Invalid location' },
        { status: 400 }
      );
    }

    // Check if username already exists (excluding current user)
    if (username && username !== existingUser.username) {
      if (users.find(u => u.username === username && u.id !== id)) {
        return NextResponse.json(
          { success: false, error: 'Username already exists' },
          { status: 400 }
        );
      }
    }

    // Check if email already exists (excluding current user)
    if (email && email !== existingUser.email) {
      if (users.find(u => u.email === email && u.id !== id)) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Update user data
    const updatedUser: User = {
      ...existingUser,
      username: username || existingUser.username,
      email: email || existingUser.email,
      role: role || existingUser.role,
      location: location || existingUser.location,
      permissions: permissions || existingUser.permissions,
      updatedAt: new Date().toISOString(),
    };

    // Update password if provided
    if (password && password.trim()) {
      updatedUser.hashedPassword = await hashPassword(password.trim());
    }

    users[userIndex] = updatedUser;
    await saveUsers(users, locations);

    // Return user without password hash
    const safeUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      location: updatedUser.location,
      permissions: updatedUser.permissions,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    console.log('[Admin API] User updated successfully:', updatedUser.username);

    return NextResponse.json({
      success: true,
      data: safeUser,
    });

  } catch (error: any) {
    console.error('[Admin API] User update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Admin API] DELETE user request received');
    
    const token = getTokenFromRequest(request);
    const payload = verifyToken(token || '');
    
    if (!payload || !canManageUsers(payload)) {
      console.log('[Admin API] Unauthorized request - admin access required');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { users, locations } = await loadUsers();
    
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userToDelete = users[userIndex];

    // Prevent admin from deleting themselves
    if (userToDelete.id === payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Prevent deleting the last admin
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (userToDelete.role === 'admin' && adminCount <= 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the last admin user' },
        { status: 400 }
      );
    }

    // Remove user
    users.splice(userIndex, 1);
    await saveUsers(users, locations);

    console.log('[Admin API] User deleted successfully:', userToDelete.username);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });

  } catch (error: any) {
    console.error('[Admin API] User deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
} 