import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** When this changes (e.g. the route path), a displayed error clears so navigation recovers. */
  resetKey?: string;
}
interface State {
  hasError: boolean;
}

/**
 * Catches render-time errors anywhere below it so a single malformed response or
 * a failed lazy-chunk load degrades to a recoverable card instead of a white screen.
 * Recovers on the next route change (resetKey) so a one-off error doesn't wedge the
 * whole content area across client-side navigation.
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

  componentDidUpdate(prev: Props) {
    // Only resets when an error is currently shown, so normal navigations don't
    // remount the routed subtree — just an errored boundary recovers on route change.
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
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
