export function ErrorMessage({ error }: { error: Error | null }) {
  return error ? (
    <div className="notice error" role="alert">
      {error.message}
    </div>
  ) : null;
}
