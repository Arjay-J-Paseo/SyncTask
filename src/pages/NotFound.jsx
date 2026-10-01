import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div className="h1">404</div>
      <p className="muted mt-8">Page not found.</p>
      <Link to="/" className="btn btn-primary mt-24">Back home</Link>
    </div>
  );
}