"use client";

import type { ErrorInfo } from "react";
import { Component } from "react";
import { AppErrorBoundaryProps } from "./types/AppErrorBoundaryProps.type";
import { AppErrorBoundaryState } from "./types/AppErrorBoundaryState.type";

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled app error", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      name: error.name,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-red-100">
            <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
            <p className="mb-4 text-sm text-red-200">
              We could not load this section. Please try again.
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded-md bg-red-500/20 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
