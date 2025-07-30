// Safe Sentry configuration that doesn't break if module is missing

export const initSentry = () => {
  console.log("[Sentry] Initialization disabled for debugging");
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  console.error("[Sentry] Exception:", error, context);
};

export const captureMessage = (message: string, level: string = "info") => {
  console.log(`[Sentry] ${level}:`, message);
};

export const setUserContext = (user: { id: string; email: string; name?: string }) => {
  console.log("[Sentry] User context:", user);
};

export const addBreadcrumb = (breadcrumb: any) => {
  console.log("[Sentry] Breadcrumb:", breadcrumb);
};