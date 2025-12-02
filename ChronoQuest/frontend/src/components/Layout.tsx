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
            {/* Sidebar - Hidden on Mobile */}
            <aside className="hidden md:flex w-64 border-r-4 border-black bg-white flex-col">
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
            <main className="flex-1 overflow-auto p-4 pb-24 md:p-8 relative">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Bottom Navigation - Visible on Mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black flex justify-around p-2 z-50 shadow-[0px_-4px_10px_rgba(0,0,0,0.1)]">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all",
                                isActive ? "text-black" : "text-gray-500 hover:text-black"
                            )}
                        >
                            <div className={clsx(
                                "p-1.5 rounded-full border-2 border-black transition-all",
                                isActive ? "bg-black text-white" : "bg-white text-black"
                            )}>
                                <Icon size={18} />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default Layout;
