import { Component, type ReactNode } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-red-400 mb-4 flex justify-center">
              <AlertTriangle className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-efx-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-efx-gray-400 mb-6 max-w-sm mx-auto">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reload Page
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
