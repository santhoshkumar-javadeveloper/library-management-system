import { Component } from 'react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Admin page error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, maxWidth: 560, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12 }}>
          <h2 style={{ margin: '0 0 12px', color: '#b91c1c', fontSize: 18 }}>Something went wrong</h2>
          <p style={{ margin: '0 0 16px', color: '#7f1d1d', fontSize: 14 }}>
            {this.state.error?.message || 'This page could not be loaded.'}
          </p>
          <Link to="/" style={{ display: 'inline-block', padding: '8px 16px', background: '#1e40af', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>← Back to Dashboard</Link>
        </div>
      );
    }
    return this.props.children;
  }
}
