import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-400 text-sm p-2 border border-red-500/20 rounded bg-red-500/10">
          <strong>Error rendering content:</strong> {this.state.error?.message || 'Unknown error'}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary