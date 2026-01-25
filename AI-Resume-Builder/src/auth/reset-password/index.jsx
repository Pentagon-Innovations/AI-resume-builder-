import React, { useState } from 'react';
import axios from 'axios';
import GlobalApi from 'service/GlobalApi';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    if (!token) {
        return <div className="p-8 text-center text-red-500">Invalid or missing token.</div>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPass !== confirmPass) {
            setError('Passwords do not match');
            return;
        }

        try {
            await GlobalApi.ResetPassword({ token, newPass });
            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => navigate('/auth/sign-in'), 3000);
        } catch (err) {
            setError('Failed to reset password. The link may have expired.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-6 text-2xl font-bold text-center">Reset Password</h2>
                {message && <p className="mb-4 text-green-500">{message}</p>}
                {error && <p className="mb-4 text-red-500">{error}</p>}
                {!message && (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block mb-2 text-sm font-medium">New Password</label>
                            <Input
                                type="password"
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block mb-2 text-sm font-medium">Confirm Password</label>
                            <Input
                                type="password"
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full">Reset Password</Button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ResetPasswordPage;
