export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        role="status"
        aria-label="Loading"
        className="h-6 w-6 animate-spin rounded-pill border-2 border-border border-t-accent"
      />
    </div>
  );
}