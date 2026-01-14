import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserDialog } from '@/components/admin/Users/UserDialog';
import { Plus, Edit, Power, PowerOff } from 'lucide-react';
import { auth } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';

export const UsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar usuarios");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleCreate = () => {
        setSelectedUser(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    const handleToggleStatus = async (user: User) => {
        try {
            await api.patch(`/admin/users/${user.id}/toggle-status`);
            toast.success(`Usuario ${user.is_active ? 'desactivado' : 'activado'}`);
            loadUsers();
        } catch (error) {
            toast.error("Error al cambiar estado");
        }
    };

    const handleSave = async (data: any) => {
        try {
            if (selectedUser) {
                await api.put(`/admin/users/${selectedUser.id}`, data);
                toast.success("Usuario actualizado");
            } else {
                await api.post('/admin/users', data);
                toast.success("Usuario creado");
            }
            setIsDialogOpen(false);
            loadUsers();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error al guardar usuario");
        }
    };

    const currentUser = auth.getUser();

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground">Administra el acceso y roles de los usuarios del sistema.</p>
                </div>
                <Button onClick={handleCreate} className="w-full md:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                </Button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            // Skeleton Loading Rows
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Skeleton className="h-8 w-8" />
                                            <Skeleton className="h-8 w-8" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.is_active ? 'outline' : 'destructive'} className={user.is_active ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                                            {user.is_active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            {user.id !== currentUser?.id && (
                                                <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(user)}>
                                                    {user.is_active ? 
                                                        <PowerOff className="h-4 w-4 text-destructive" /> : 
                                                        <Power className="h-4 w-4 text-green-600" />
                                                    }
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm space-y-3">
                            <Skeleton className="h-5 w-1/2" />
                            <Skeleton className="h-4 w-3/4" />
                             <div className="flex gap-2">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-5 w-16" />
                             </div>
                        </div>
                    ))
                ) : (
                    users.map((user) => (
                        <div key={user.id} className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold">{user.name}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(user)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    {user.id !== currentUser?.id && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleStatus(user)}>
                                            {user.is_active ? 
                                                <PowerOff className="h-4 w-4 text-destructive" /> : 
                                                <Power className="h-4 w-4 text-green-600" />
                                            }
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-auto">
                                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                    {user.role}
                                </Badge>
                                <Badge variant={user.is_active ? 'outline' : 'destructive'} className={user.is_active ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                </Badge>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <UserDialog 
                open={isDialogOpen} 
                onOpenChange={setIsDialogOpen} 
                user={selectedUser} 
                onSave={handleSave} 
            />
        </div>
    );
};
