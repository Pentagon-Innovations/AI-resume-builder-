import React, { useState } from 'react';
import axios from 'axios';
import GlobalApi from 'service/GlobalApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await GlobalApi.ForgotPassword(email);
            setMessage('If an account exists with this email, you will receive a password reset link.');
        } catch (err) {
            setError('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-6 text-2xl font-bold text-center">Forgot Password</h2>
                {message && <p className="mb-4 text-green-500">{message}</p>}
                {error && <p className="mb-4 text-red-500">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full">Send Reset Link</Button>
                </form>
                <div className="mt-4 text-center">
                    <a href="/auth/sign-in" className="text-sm text-blue-500 hover:underline">Back to Sign In</a>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;
