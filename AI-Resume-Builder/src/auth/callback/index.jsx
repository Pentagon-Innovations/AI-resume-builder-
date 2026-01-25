import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refresh_token');
        const email = searchParams.get('email');
        const firstName = searchParams.get('firstName');
        const lastName = searchParams.get('lastName');

        if (token) {
            // Ideally we'd fetch the user profile here too if not sent in URL
            // For now, we'll assume the basic token allows entry, and the next API call will fetch data if needed
            // Or we could pass 'user' as a base64 string in URL, but let's stick to token for now

            // Setting a placeholder user or fetching it
            const userData = { email, firstName, lastName };

            login(userData, token, refreshToken);
            navigate('/dashboard');
        } else {
            navigate('/auth/sign-in');
        }
    }, [searchParams, login, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Completing login...</p>
            </div>
        </div>
    );
}

export default AuthCallback;
