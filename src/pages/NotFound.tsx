import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-bg px-4">
      <div className="text-center">
        <h1 className="mb-4 text-5xl md:text-7xl lg:text-8xl font-bold text-hero-text">404</h1>
        <p className="mb-6 text-lg md:text-xl text-hero-text-muted">Oops! Page not found</p>
        <Link to="/" className="inline-block px-6 py-3 bg-hero-accent text-hero-bg font-semibold rounded-lg hover:bg-hero-accent/80 transition-colors text-sm">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
