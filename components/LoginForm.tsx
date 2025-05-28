'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">AI Task Manager</CardTitle>
          <CardDescription>
            Sign in to access your task management dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium mb-2">Demo Credentials:</p>
            <div className="space-y-1">
              <p><strong>Admin:</strong> admin / password (all regions)</p>
              <div className="mt-2">
                <p className="text-gray-600 font-medium">Data Managers:</p>
                <p><strong>EU Manager:</strong> eu_manager / password</p>
                <p><strong>USA Manager:</strong> usa_manager / password</p>
                <p><strong>IL Manager:</strong> il_manager / password</p>
              </div>
              <div className="mt-2">
                <p className="text-gray-600 font-medium">Viewers:</p>
                <p><strong>EU Viewer:</strong> eu_viewer / password</p>
                <p><strong>USA Viewer:</strong> usa_viewer / password</p>
                <p><strong>IL Viewer:</strong> il_viewer / password</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 