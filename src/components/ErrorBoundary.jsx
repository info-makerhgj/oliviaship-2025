import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
            {/* Icon */}
            <div className="bg-gradient-to-br from-red-100 to-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertTriangle className="text-4xl text-red-500" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              عذراً، حدث خطأ ما!
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              حدث خطأ غير متوقع. نعتذر عن الإزعاج. يرجى المحاولة مرة أخرى.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 text-right">
                <p className="text-sm font-mono text-red-700 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gradient-to-r from-blue-400 to-purple-400 text-white hover:from-blue-500 hover:to-purple-500 px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <FiRefreshCw />
                إعادة المحاولة
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-300 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <FiHome />
                الصفحة الرئيسية
              </button>
            </div>

            {/* Support Link */}
            <p className="text-sm text-gray-500 mt-6">
              إذا استمرت المشكلة، يرجى{' '}
              <a href="/contact" className="text-purple-400 hover:text-purple-400 underline">
                التواصل معنا
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
