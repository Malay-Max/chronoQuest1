import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, PlusSquare, Gamepad2 } from 'lucide-react';
import clsx from 'clsx';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Timeline', icon: Clock },
        { path: '/add', label: 'Add Notes', icon: PlusSquare },
        { path: '/train', label: 'Training Mode', icon: Gamepad2 },
    ];

    return (
        <div className="flex h-screen bg-brutal-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r-4 border-black bg-white flex flex-col">
                <div className="p-6 border-b-4 border-black">
                    <h1 className="text-2xl font-bold uppercase tracking-tighter">ChronoQuest</h1>
                </div>
                <nav className="flex-1 p-4 space-y-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-3 p-3 border-2 border-black transition-all",
                                    isActive
                                        ? "bg-black text-white shadow-[4px_4px_0px_0px_rgba(128,128,128,1)]"
                                        : "bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                )}
                            >
                                <Icon size={20} />
                                <span className="font-bold">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t-4 border-black text-xs text-center font-bold">
                    v1.0.0 BETA
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8 relative">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
