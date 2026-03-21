import Navbar from './Navbar';
import { Outlet, useLocation } from 'react-router-dom';

const AUTH_ROUTES = ['/login', '/register'];

export default function Layout() {
  const { pathname } = useLocation();
  const hideNav = AUTH_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen bg-slate-950">
      {!hideNav && <Navbar />}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
