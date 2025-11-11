"use client"

import React from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export interface DataTableErrorBoundaryProps {
  /**
   * The content to render when there's no error
   */
  children: React.ReactNode
  /**
   * Custom fallback UI to show when an error occurs
   */
  fallback?: React.ReactNode
  /**
   * Callback fired when an error is caught
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /**
   * Whether to show a reset button
   * @default true
   */
  showResetButton?: boolean
  /**
   * Custom reset button text
   * @default "Try Again"
   */
  resetButtonText?: string
}

interface DataTableErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component for DataTable.
 * Catches JavaScript errors anywhere in the data table component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 *
 * @example
 * Basic usage
 * <DataTableErrorBoundary>
 *   <DataTableRoot data={data} columns={columns}>
 *     <DataTable>
 *       <DataTableHeader />
 *       <DataTableBody />
 *     </DataTable>
 *   </DataTableRoot>
 * </DataTableErrorBoundary>
 *
 * @example
 * // With custom fallback
 * <DataTableErrorBoundary
 *   fallback={
 *     <div className="p-8 text-center">
 *       <h3>Oops! Something went wrong.</h3>
 *       <p>Please contact support if this persists.</p>
 *     </div>
 *   }
 * >
 *   <DataTableRoot data={data} columns={columns}>
 *     {/* ... *\/}
 *   </DataTableRoot>
 * </DataTableErrorBoundary>
 *
 * @example
 * // With error logging
 * <DataTableErrorBoundary
 *   onError={(error, errorInfo) => {
 *     console.error("DataTable Error:", error, errorInfo)
 *     // Send to error tracking service
 *     trackError(error)
 *   }}
 * >
 *   <DataTableRoot data={data} columns={columns}>
 *     {/* ... *\/}
 *   </DataTableRoot>
 * </DataTableErrorBoundary>
 */
export class DataTableErrorBoundary extends React.Component<
  DataTableErrorBoundaryProps,
  DataTableErrorBoundaryState
> {
  static displayName = "DataTableErrorBoundary"

  constructor(props: DataTableErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): DataTableErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("DataTable Error Boundary caught an error:", error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { showResetButton = true, resetButtonText = "Try Again" } =
        this.props

      // Default error UI
      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Table Error</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-2">
            <p>
              {this.state.error?.message ||
                "Something went wrong while displaying the table."}
            </p>
            {showResetButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                className="mt-2 w-fit"
              >
                {resetButtonText}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}
