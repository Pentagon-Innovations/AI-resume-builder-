import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { HiBriefcase, HiUsers, HiSquares2X2, HiArrowRightOnRectangle } from "react-icons/hi2";

function RecruiterLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/auth/sign-in');
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-indigo-900 text-white flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <HiBriefcase className="w-6 h-6" />
                        ResuAlign B2B
                    </h1>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <Link to="/recruiter/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-800 transition">
                        <HiSquares2X2 className="w-5 h-5" />
                        Dashboard
                    </Link>
                    <Link to="/recruiter/jobs" className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-800 transition">
                        <Briefcase className="w-5 h-5" />
                        My Jobs
                    </Link>
                    <Link to="/recruiter/candidates" className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-800 transition text-sm">
                        <HiUsers className="w-5 h-5" />
                        All Candidates
                    </Link>
                    <div className="pt-4 mt-4 border-t border-indigo-800/50">
                        <Link to="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-800 transition text-sm text-indigo-200 hover:text-white">
                            <HiSquares2X2 className="w-5 h-5" />
                            Back to Home
                        </Link>
                        <Link to="/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-800 transition text-sm text-indigo-200 hover:text-white">
                            <HiUsers className="w-5 h-5" />
                            Candidate Dashboard
                        </Link>
                    </div>
                </nav>
                <div className="p-4 border-t border-indigo-800">
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-indigo-800" onClick={handleLogout}>
                        <HiArrowRightOnRectangle className="w-5 h-5 mr-3" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white shadow-sm p-4 flex justify-end items-center px-8">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Recruiter Panel</span>
                        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs">
                            RP
                        </div>
                    </div>
                </header>
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default RecruiterLayout;
