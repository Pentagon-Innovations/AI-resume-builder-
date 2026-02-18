import React from 'react';
import { Button } from '@/components/ui/button';
import { HiExclamationTriangle, HiArrowPath, HiHome } from "react-icons/hi2";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-red-50 p-6 flex justify-center">
                            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                                <HiExclamationTriangle className="h-10 w-10 text-red-600" />
                            </div>
                        </div>
                        <div className="p-6 text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                            <p className="text-gray-600 mb-6">
                                We encountered an unexpected error. Please try reloading the page.
                            </p>

                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left overflow-auto max-h-40 border border-gray-200">
                                <p className="text-xs font-mono text-red-600 break-words">
                                    {this.state.error && this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <details className="mt-2 text-xs text-gray-500 font-mono">
                                        <summary className="cursor-pointer hover:text-gray-700">Stack Trace</summary>
                                        <pre className="mt-2 whitespace-pre-wrap">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>

                            <div className="flex gap-3 justify-center">
                                <Button onClick={this.handleHome} variant="outline" className="flex items-center gap-2">
                                    <HiHome className="h-4 w-4" />
                                    Home
                                </Button>
                                <Button onClick={this.handleReload} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                                    <HiArrowPath className="h-4 w-4" />
                                    Reload Page
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
