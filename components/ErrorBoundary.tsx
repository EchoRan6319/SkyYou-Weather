import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = { hasError: false, error: null };
    public props: ErrorBoundaryProps;

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.props = props;
    }

    static getDerivedStateFromError(error: any): ErrorBoundaryState {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 text-red-600 bg-white h-screen overflow-auto">
                    <h1>Something went wrong.</h1>
                    <pre>{this.state.error?.toString()}</pre>
                    <pre>{this.state.error?.stack}</pre>
                    <button
                        onClick={() => { localStorage.clear(); window.location.reload(); }}
                        className="mt-4 p-2 bg-gray-200 text-gray-900 rounded-lg"
                    >
                        Clear Data & Reload
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
