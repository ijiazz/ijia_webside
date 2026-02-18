export function PageLoading(props: { title?: string }) {
  const { title = "Loading" } = props;
  return (
    <div className="app-loading">
      <div className="app-loading-animation">
        <h1>{title}</h1>
      </div>
    </div>
  );
}
