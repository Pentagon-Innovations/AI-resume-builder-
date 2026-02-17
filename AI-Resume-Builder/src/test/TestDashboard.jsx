import React, { useState, useEffect } from 'react';
import { Play, Check, X, AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import GlobalApi from '../../service/GlobalApi';

const TestDashboard = () => {
    const [testResults, setTestResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedModule, setSelectedModule] = useState('all');

    const testModules = [
        { id: 'all', name: 'All Tests', icon: FileText },
        { id: 'auth', name: 'Authentication', icon: Check },
        { id: 'users', name: 'Users', icon: Check },
        { id: 'billing', name: 'Billing', icon: Check },
        { id: 'resume', name: 'Resume', icon: Check },
        { id: 'pdf', name: 'PDF Generation', icon: Check },
        { id: 'ats', name: 'ATS', icon: Check },
        { id: 'analyze', name: 'Resume Analysis', icon: Check },
        { id: 'improve', name: 'Resume Improvement', icon: Check },
    ];

    const mockTestResults = {
        summary: {
            total: 86,
            passed: 6,
            failed: 0,
            skipped: 80,
            duration: '20.36s',
            coverage: '45%'
        },
        suites: [
            {
                name: 'Auth Service',
                status: 'skipped',
                tests: [
                    { name: 'should validate user with correct credentials', status: 'skipped', duration: '12ms' },
                    { name: 'should return null for invalid credentials', status: 'skipped', duration: '8ms' },
                    { name: 'should hash password on registration', status: 'skipped', duration: '15ms' },
                    { name: 'should reject duplicate email', status: 'skipped', duration: '10ms' },
                    { name: 'should handle OAuth login', status: 'skipped', duration: '14ms' },
                ]
            },
            {
                name: 'Users Service',
                status: 'skipped',
                tests: [
                    { name: 'should create new user', status: 'skipped', duration: '10ms' },
                    { name: 'should find user by email', status: 'skipped', duration: '8ms' },
                    { name: 'should authorize when quota available', status: 'skipped', duration: '12ms' },
                    { name: 'should deny when quota exhausted', status: 'skipped', duration: '9ms' },
                    { name: 'should reset quota monthly', status: 'skipped', duration: '11ms' },
                ]
            },
            {
                name: 'Billing Service',
                status: 'passed',
                tests: [
                    { name: 'should create Razorpay order', status: 'passed', duration: '15ms' },
                    { name: 'should verify payment signature', status: 'passed', duration: '12ms' },
                    { name: 'should upgrade user to Pro', status: 'passed', duration: '18ms' },
                    { name: 'should reject invalid signature', status: 'passed', duration: '10ms' },
                ]
            },
            {
                name: 'Resume Service',
                status: 'skipped',
                tests: [
                    { name: 'should create new resume', status: 'skipped', duration: '14ms' },
                    { name: 'should fetch user resumes', status: 'skipped', duration: '11ms' },
                    { name: 'should update resume with photo', status: 'skipped', duration: '16ms' },
                    { name: 'should delete resume', status: 'skipped', duration: '9ms' },
                ]
            },
            {
                name: 'ATS Service',
                status: 'skipped',
                tests: [
                    { name: 'should create job posting', status: 'skipped', duration: '13ms' },
                    { name: 'should screen multiple resumes', status: 'skipped', duration: '25ms' },
                    { name: 'should rank candidates by score', status: 'skipped', duration: '18ms' },
                    { name: 'should delete job and candidates', status: 'skipped', duration: '12ms' },
                ]
            },
            {
                name: 'App Controller',
                status: 'passed',
                tests: [
                    { name: 'should return "Hello World!"', status: 'passed', duration: '5ms' },
                    { name: 'should be defined', status: 'passed', duration: '3ms' },
                ]
            },
        ]
    };

    const runTests = async (module = 'all') => {
        setLoading(true);
        try {
            // In a real scenario, you'd call your backend API
            // const response = await GlobalApi.runTests(module);
            // setTestResults(response.data);

            // For now, using mock data
            setTimeout(() => {
                setTestResults(mockTestResults);
                setLoading(false);
            }, 2000);
        } catch (error) {
            console.error('Error running tests:', error);
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'passed':
                return <Check className="w-5 h-5 text-green-500" />;
            case 'failed':
                return <X className="w-5 h-5 text-red-500" />;
            case 'skipped':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'passed':
                return 'bg-green-50 border-green-200';
            case 'failed':
                return 'bg-red-50 border-red-200';
            case 'skipped':
                return 'bg-yellow-50 border-yellow-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Test Dashboard</h1>
                            <p className="text-gray-600 mt-1">Monitor and run backend test suites</p>
                        </div>
                        <button
                            onClick={() => runTests(selectedModule)}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Running Tests...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Run Tests
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Module Filter */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {testModules.map((module) => (
                            <button
                                key={module.id}
                                onClick={() => setSelectedModule(module.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${selectedModule === module.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <module.icon className="w-4 h-4" />
                                {module.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Test Summary */}
                {testResults && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="text-sm text-gray-600 mb-1">Total Tests</div>
                            <div className="text-3xl font-bold text-gray-900">{testResults.summary.total}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="text-sm text-gray-600 mb-1">Passed</div>
                            <div className="text-3xl font-bold text-green-600">{testResults.summary.passed}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="text-sm text-gray-600 mb-1">Failed</div>
                            <div className="text-3xl font-bold text-red-600">{testResults.summary.failed}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="text-sm text-gray-600 mb-1">Skipped</div>
                            <div className="text-3xl font-bold text-yellow-600">{testResults.summary.skipped}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="text-sm text-gray-600 mb-1">Coverage</div>
                            <div className="text-3xl font-bold text-blue-600">{testResults.summary.coverage}</div>
                        </div>
                    </div>
                )}

                {/* Test Suites */}
                {testResults && (
                    <div className="space-y-4">
                        {testResults.suites.map((suite, idx) => (
                            <div key={idx} className={`bg-white rounded-lg shadow-sm border-2 ${getStatusColor(suite.status)} overflow-hidden`}>
                                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(suite.status)}
                                        <h3 className="text-lg font-semibold text-gray-900">{suite.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-600">
                                            {suite.tests.length} tests
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${suite.status === 'passed' ? 'bg-green-100 text-green-800' :
                                            suite.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {suite.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-2">
                                        {suite.tests.map((test, testIdx) => (
                                            <div key={testIdx} className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    {getStatusIcon(test.status)}
                                                    <span className="text-sm text-gray-700">{test.name}</span>
                                                </div>
                                                <span className="text-xs text-gray-500">{test.duration}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!testResults && !loading && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Test Results Yet</h3>
                        <p className="text-gray-600 mb-6">Click "Run Tests" to execute the test suite</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestDashboard;
