import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  location: string;
  permissions: string[];
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    location: user.location,
    permissions: user.permissions,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Helper functions for role-based access control
export function hasPermission(userPayload: JWTPayload, requiredPermission: string): boolean {
  return userPayload.permissions.includes(requiredPermission) || userPayload.role === 'admin';
}

export function canAccessCountry(userPayload: JWTPayload, country: string): boolean {
  return userPayload.permissions.includes(country) || userPayload.role === 'admin';
}

export function isAdmin(userPayload: JWTPayload): boolean {
  return userPayload.role === 'admin';
}

export function isDataManager(userPayload: JWTPayload): boolean {
  return userPayload.role === 'data_manager' || userPayload.role === 'admin';
}

export function canManageTasks(userPayload: JWTPayload): boolean {
  return userPayload.role === 'data_manager' || userPayload.role === 'admin';
}

export function canManageUsers(userPayload: JWTPayload): boolean {
  return userPayload.role === 'admin';
} 