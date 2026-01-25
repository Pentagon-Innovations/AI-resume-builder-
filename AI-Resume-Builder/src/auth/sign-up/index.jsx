import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GlobalApi from 'service/GlobalApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

function SignUpPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await GlobalApi.Register({
                email,
                password,
                firstName,
                lastName
            });
            // Auto login
            login(response.data.user, response.data.access_token, response.data.refresh_token);
            navigate('/dashboard');
        } catch (err) {
            setError('Registration failed. Email might be in use.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-6 text-2xl font-bold text-center">Sign Up</h2>
                {error && <p className="mb-4 text-red-500">{error}</p>}
                <form onSubmit={handleRegister}>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">First Name</label>
                        <Input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">Last Name</label>
                        <Input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>
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
                    <Button type="submit" className="w-full">Sign Up</Button>
                </form>
                <div className="mt-4 text-center">
                    <p className="text-sm">Already have an account? <a href="/auth/sign-in" className="text-blue-500 hover:underline">Sign In</a></p>
                </div>
            </div>
        </div>
    );
}

export default SignUpPage;
