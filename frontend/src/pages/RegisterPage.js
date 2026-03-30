import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowRight, User, Lock, IdentificationCard } from '@phosphor-icons/react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);

    const result = await register(formData.email, formData.password, formData.name);
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
            <CardTitle className="text-2xl font-heading tracking-tight">Create Account</CardTitle>
            <CardDescription className="font-mono text-xs">Register to start trading with TradePro AI</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-mono uppercase tracking-wider">Full Name</Label>
                <div className="relative">
                  <IdentificationCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 rounded-none border-2 font-mono text-sm"
                    data-testid="register-name-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 rounded-none border-2 font-mono text-sm"
                    data-testid="register-email-input"
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
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 rounded-none border-2 font-mono text-sm"
                    data-testid="register-password-input"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 border-2 border-destructive bg-destructive/10 text-destructive text-xs font-mono" data-testid="register-error">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-none h-11 font-mono text-sm uppercase tracking-wider transition-base"
                disabled={isLoading}
                data-testid="register-submit-button"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-t border-border pt-6">
            <p className="text-xs text-center font-mono text-muted-foreground w-full">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-semibold" data-testid="login-link">
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;