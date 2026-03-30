import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowRight, User, Lock } from '@phosphor-icons/react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);

    const result = await login(formData.email, formData.password);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold tracking-tighter mb-2">TRADEPRO AI</h1>
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Enterprise Trading Platform</p>
        </div>

        <Card className="border-2 border-border rounded-none shadow-none">
          <CardHeader className="border-b border-border pb-6">
            <CardTitle className="text-2xl font-heading tracking-tight">Sign In</CardTitle>
            <CardDescription className="font-mono text-xs">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@tradepro.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 rounded-none border-2 font-mono text-sm"
                    data-testid="login-email-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 rounded-none border-2 font-mono text-sm"
                    data-testid="login-password-input"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 border-2 border-destructive bg-destructive/10 text-destructive text-xs font-mono" data-testid="login-error">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-none h-11 font-mono text-sm uppercase tracking-wider transition-base"
                disabled={isLoading}
                data-testid="login-submit-button"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-t border-border pt-6 flex-col space-y-4">
            <p className="text-xs text-center font-mono text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold" data-testid="register-link">
                Register here
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="mt-6 p-4 border-2 border-border bg-secondary/30">
          <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Demo Credentials</p>
          <p className="text-xs font-mono">Email: admin@tradepro.com</p>
          <p className="text-xs font-mono">Password: admin123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;