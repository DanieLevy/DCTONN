import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest, canManageUsers, hashPassword } from '@/lib/auth';
import { loadUsers, saveUsers, generateId } from '@/lib/data-store';
import { User } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    console.log('[Admin API] GET users request received');
    
    const token = getTokenFromRequest(request);
    const payload = verifyToken(token || '');
    
    if (!payload || !canManageUsers(payload)) {
      console.log('[Admin API] Unauthorized request - admin access required');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    console.log('[Admin API] Admin authenticated:', payload.username);

    const { users, locations } = await loadUsers();
    
    // Remove password hashes from response
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      location: user.location,
      permissions: user.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: safeUsers,
        locations
      },
    });

  } catch (error: any) {
    console.error('[Admin API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Admin API] POST create user request received');
    
    const token = getTokenFromRequest(request);
    const payload = verifyToken(token || '');
    
    if (!payload || !canManageUsers(payload)) {
      console.log('[Admin API] Unauthorized request - admin access required');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const userData = await request.json();
    const { username, email, password, role, location, permissions } = userData;

    // Validate required fields
    if (!username || !email || !password || !role || !location || !permissions) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'data_manager', 'viewer'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Validate location
    if (!['EU', 'USA', 'IL'].includes(location)) {
      return NextResponse.json(
        { success: false, error: 'Invalid location' },
        { status: 400 }
      );
    }

    const { users, locations } = await loadUsers();
    
    // Check if username already exists
    if (users.find(u => u.username === username)) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Check if email already exists
    if (users.find(u => u.email === email)) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    const newUser: User = {
      id: generateId(),
      username,
      email,
      role,
      location,
      permissions: Array.isArray(permissions) ? permissions : [permissions],
      hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    await saveUsers(users, locations);

    // Return user without password hash
    const safeUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      location: newUser.location,
      permissions: newUser.permissions,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    console.log('[Admin API] User created successfully:', newUser.username);

    return NextResponse.json({
      success: true,
      data: safeUser,
    });

  } catch (error: any) {
    console.error('[Admin API] User creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
} 