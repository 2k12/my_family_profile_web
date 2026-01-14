import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '@/lib/auth';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard, FileText, User as UserIcon, LogOut } from 'lucide-react';

export const AppLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (!auth.isAuthenticated()) {
            navigate('/login');
            return;
        }
        const currentUser = auth.getUser();
        setUser(currentUser);

        // Protect Admin Routes
        if (location.pathname.startsWith('/admin') && currentUser?.role !== 'ADMIN') {
             navigate('/bi');
        }

    }, [navigate, location.pathname]);

    const handleLogout = () => {
        auth.logout();
    };

    if (!user) return null;

    const navItems = [
        { label: 'Gestión Fichas', path: '/admin/forms', icon: FileText }, // Keeping legacy name for forms builder or rename?
        { label: 'Fichas Familiares', path: '/admin/fichas', icon: LayoutDashboard }, // Using LayoutDashboard temporarily
        { label: 'Gestión Usuarios', path: '/admin/users', icon: UserIcon },
        { label: 'BI Analytics', path: '/bi', icon: LayoutDashboard },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <header className="border-b">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="font-bold text-xl">Mi Perfil Familiar</div>
                        
                        <nav className="hidden md:flex items-center gap-6">
                            {navItems.filter(item => {
                                if ((item.label === 'Gestión Fichas' || item.label === 'Gestión Usuarios') && user.role !== 'ADMIN') return false;
                                return true;
                            }).map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname.startsWith(item.path);
                                return (
                                    <Link 
                                        key={item.path} 
                                        to={item.path}
                                        className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="" alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate('/profile')}>
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    <span>Perfil de Usuario</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};
