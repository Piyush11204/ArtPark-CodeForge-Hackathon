import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
