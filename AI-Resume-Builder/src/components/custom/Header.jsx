import React from 'react'
import { Button } from '../ui/button'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from '../../context/AuthContext.jsx';

function Header() {
    const { token, logout } = useAuth();
    const isSignedIn = !!token;
    return (
        <div className='p-3 px-5 flex justify-between shadow-md'>
            <div className="flex items-center gap-10">
                <Link to={'/'}>
                    <div className="flex items-center gap-3 cursor-pointer"><div className="p-2 rounded-lg bg-indigo-600">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                            </path></svg></div><div className="flex flex-col"><span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">ResuAlign</span></div></div>
                </Link>
                <Link to={'/recruiter/dashboard'} className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition">
                    For Employers
                </Link>
                <Link to={'/pricing'} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1">
                    <Sparkles className="w-4 h-4" /> Upgrade to Pro
                </Link>
            </div>
            {isSignedIn ?
                <div className='flex gap-2 items-center'>
                    <Link to={'/pricing'} className="mr-4 text-sm font-medium text-gray-500 hover:text-indigo-600 transition">
                        Plans
                    </Link>
                    <Link to={'/dashboard'}>
                        <Button variant="outline" className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl shadow hover:bg-indigo-700 transition text-sm">Resume Dashboard</Button>
                    </Link>
                    <Button variant="ghost" onClick={logout} className="text-sm">Logout</Button>
                </div> :
                <Link to={'/auth/sign-in'}>
                    <Button className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl shadow hover:bg-indigo-700 transition text-sm">Login</Button>
                </Link>
            }

        </div>
    )
}

export default Header