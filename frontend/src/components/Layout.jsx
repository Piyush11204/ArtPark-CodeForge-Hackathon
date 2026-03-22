import Navbar from './Navbar';
import Footer from './Footer';
import ChatWidget from './ChatWidget';
import { Outlet, useLocation } from 'react-router-dom';

const AUTH_ROUTES = ['/login', '/register'];
// Routes where footer should not appear (app-interior pages)
const NO_FOOTER_ROUTES = ['/dashboard', '/onboard', '/pathway', '/profile'];

export default function Layout() {
  const { pathname } = useLocation();
  const hideNav = AUTH_ROUTES.includes(pathname);
  const hideFooter = AUTH_ROUTES.includes(pathname) || NO_FOOTER_ROUTES.some(r => pathname.startsWith(r));

  return (
    <div className="min-h-screen bg-[#050811] flex flex-col">
      {!hideNav && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
      <ChatWidget />
    </div>
  );
}
