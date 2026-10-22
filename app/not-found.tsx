export default function NotFound() {
  return (
    <div style={{ maxWidth: 560, margin: '80px auto', textAlign: 'center', padding: 16 }}>
      <h1 className="font-display" style={{ fontSize: 44 }}>Page not found</h1>
      <p style={{ marginTop: 12 }}>This page doesn’t exist.</p>
      <a href="/" className="btn btn-brand" style={{ marginTop: 24 }}>Go to the homepage</a>
    </div>
  );
}
