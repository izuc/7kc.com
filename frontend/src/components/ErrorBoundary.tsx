import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Catches render-time errors anywhere below it so a single malformed response or
 * a failed lazy-chunk load degrades to a recoverable card instead of a white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty" style={{ minHeight: '60vh', justifyContent: 'center' }}>
          <h2>Something went wrong.</h2>
          <p className="muted">A part of the app hit an unexpected error.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
