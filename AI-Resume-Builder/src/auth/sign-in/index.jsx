import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GlobalApi from 'service/GlobalApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await GlobalApi.Login({ email, password });
      login(response.data.user, response.data.access_token, response.data.refresh_token);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  const handleGoogleLogin = () => {
    // Fail-safe sanitization
    const cleanUrl = (GlobalApi.BASE_URL || '').replace(/\/+$/, "");
    console.log('[SignInPage] Current Origin:', window.location.origin);
    console.log('[SignInPage] Redirecting to Google:', `${cleanUrl}/auth/google`);
    window.location.href = `${cleanUrl}/auth/google`;
  };

  const handleLinkedInLogin = () => {
    const cleanUrl = (GlobalApi.BASE_URL || '').replace(/\/+$/, "");
    window.location.href = `${cleanUrl}/auth/linkedin`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="mb-6 text-2xl font-bold text-center">Sign In</h2>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">Sign In</Button>
        </form>

        <div className="mt-4 text-center">
          <a href="/auth/forgot-password" className="text-xs text-gray-500 hover:underline">Forgot password?</a>
        </div>

        <div className="mt-4">
          <Button variant="outline" className="w-full mb-2" onClick={handleGoogleLogin}>
            Sign in with Google
          </Button>
          <Button variant="outline" className="w-full" onClick={handleLinkedInLogin}>
            Sign in with LinkedIn
          </Button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm">Don't have an account? <a href="/auth/sign-up" className="text-blue-500 hover:underline">Sign Up</a></p>
        </div>
        <div className="mt-8 text-[8px] text-gray-300 text-center">
          v1.0.3-sanitized
        </div>
      </div>
    </div>
  );
}

export default SignInPage;