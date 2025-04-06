/**
 * Global error handler for the application
 * This will catch unhandled errors and redirect to the error page
 */

export const setupGlobalErrorHandler = () => {
  // Check if we've already redirected to avoid infinite loops
  // Using sessionStorage to persist across function calls
  const hasRedirectedKey = "hasRedirectedToErrorPage";
  const hasRedirected = sessionStorage.getItem(hasRedirectedKey) === "true";

  // Handler for uncaught exceptions
  const handleGlobalError = (
    event: ErrorEvent | PromiseRejectionEvent,
    source: string
  ) => {
    // Prevent default browser error handling
    event.preventDefault();

    // Log the error
    console.error(`Global ${source} caught:`, event);

    // Only redirect once to avoid infinite loops
    if (!hasRedirected) {
      try {
        // Mark that we've redirected
        sessionStorage.setItem(hasRedirectedKey, "true");

        // Clear the flag after 10 seconds to allow future error redirects
        setTimeout(() => {
          sessionStorage.removeItem(hasRedirectedKey);
        }, 10000);
      } catch (e) {
        console.error("Failed to set redirection flag:", e);
      }

      // Get error details
      const errorMessage =
        event instanceof ErrorEvent
          ? event.message
          : "Unhandled Promise Rejection";

      // Store error information in sessionStorage so it can be displayed on the error page
      try {
        sessionStorage.setItem(
          "lastError",
          JSON.stringify({
            message: errorMessage,
            stack: event instanceof ErrorEvent ? event.error?.stack : undefined,
            timestamp: new Date().toISOString(),
            source: source,
          })
        );
      } catch (e) {
        console.error("Failed to store error details:", e);
      }

      // Redirect to error page
      window.location.href = "/error";
    }
  };

  // Set up event listeners for uncaught exceptions and unhandled promise rejections
  window.addEventListener("error", (event) =>
    handleGlobalError(event, "error")
  );
  window.addEventListener("unhandledrejection", (event) =>
    handleGlobalError(event, "promise rejection")
  );

  // Return a function to remove the event listeners if needed
  return () => {
    window.removeEventListener("error", (event) =>
      handleGlobalError(event, "error")
    );
    window.removeEventListener("unhandledrejection", (event) =>
      handleGlobalError(event, "promise rejection")
    );
  };
};
