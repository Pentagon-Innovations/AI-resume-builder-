import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Zap, Shield, Sparkles } from 'lucide-react';
import GlobalApi from 'service/GlobalApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

function Pricing() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const { user } = useAuth();

    // Dynamic Razorpay Load
    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async (plan) => {
        if (plan === 'free') {
            navigate('/dashboard');
            return;
        }

        setLoading(true);
        try {
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                alert('Razorpay SDK failed to load. Please check your internet connection.');
                setLoading(false);
                return;
            }

            const resp = await GlobalApi.CreateRazorpayOrder({ amount: 499 });
            const order = resp.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "ResuAlign Pro",
                description: "Upgrade to Professional Plan",
                order_id: order.id,
                handler: async function (response) {
                    try {
                        const verifyResp = await GlobalApi.VerifyRazorpayPayment(response);
                        if (verifyResp.data.success) {
                            alert('Welcome to Pro! Your account has been upgraded.');
                            navigate('/dashboard');
                        }
                    } catch (err) {
                        alert('Payment verification failed.');
                    }
                },
                prefill: {
                    name: user?.firstName + " " + (user?.lastName || ""),
                    email: user?.email,
                },
                theme: { color: "#6366F1" },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error('Failed to initiate payment', err);
            const msg = err.response?.data?.message || 'Failed to start payment. Please ensure you are logged in.';
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="py-20 px-4 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto text-center mb-16">
                <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                    Clear, Simple Pricing
                </h1>
                <p className="mt-4 text-xl text-gray-600">
                    Choose the plan that's right for your career growth.
                </p>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                {/* Free Plan */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col hover:shadow-lg transition">
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-widest">Free Tier</h3>
                        <div className="mt-4 flex items-baseline text-gray-900">
                            <span className="text-5xl font-extrabold tracking-tight">$0</span>
                            <span className="ml-1 text-xl font-semibold text-gray-500">/month</span>
                        </div>
                        <p className="mt-4 text-gray-500">Perfect for trying out our AI features.</p>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-start gap-3 text-gray-600">
                            <Check className="w-5 h-5 text-green-500 shrink-0" />
                            <span>5 AI Analysis Runs / month</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-600">
                            <Check className="w-5 h-5 text-green-500 shrink-0" />
                            <span>Basic Resume Templates Only</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-600">
                            <Check className="w-5 h-5 text-green-500 shrink-0" />
                            <span>JD Keyword Matching</span>
                        </li>
                    </ul>

                    <Button
                        variant="outline"
                        className="w-full py-6 text-lg font-bold border-gray-200 hover:bg-gray-50"
                        onClick={() => handleUpgrade('free')}
                    >
                        Get Started
                    </Button>
                </div>

                {/* Pro Plan */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-500 p-8 flex flex-col relative scale-105">
                    <div className="absolute top-0 right-8 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Sparkles className="w-3 h-3" /> MOST POPULAR
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-indigo-600 uppercase tracking-widest">Pro Professional</h3>
                        <div className="mt-4 flex items-baseline text-gray-900">
                            <span className="text-5xl font-extrabold tracking-tight">$9</span>
                            <span className="ml-1 text-xl font-semibold text-gray-500">/month</span>
                        </div>
                        <p className="mt-4 text-gray-500">Everything you need for a competitive edge.</p>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-start gap-3 text-gray-800 font-medium">
                            <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                            <span>Unlimited AI Analysis & Feedback</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-800 font-medium">
                            <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                            <span>Access to All Premium Templates</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-800 font-medium">
                            <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                            <span>Bulk Screening (for Employers)</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-800 font-medium">
                            <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                            <span>Direct PDF Downloads & Editing</span>
                        </li>
                    </ul>

                    <Button
                        className="w-full py-6 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 shadow-xl mb-4"
                        disabled={loading}
                        onClick={() => handleUpgrade('pro')}
                    >
                        {loading ? 'Processing...' : 'Upgrade with Razorpay'}
                    </Button>

                    <div className="w-full mt-4">
                        {/* PayPal Removed */}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Pricing;
