import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';
import api from '@/lib/api';
import type { User } from '@/types';
import { toast } from "sonner"
import { Skeleton } from '@/components/ui/skeleton';

interface ProfileForm {
    name: string;
    email: string;
}

export const ProfilePage = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    
    const { register, handleSubmit, reset } = useForm<ProfileForm>();

    useEffect(() => {
        const currentUser = auth.getUser();
        if (currentUser) {
            setUser(currentUser);
            reset({
                name: currentUser.name,
                email: currentUser.email
            });
        }
    }, [reset]);

    const onSubmit = async (data: ProfileForm) => {
        setLoading(true);
        try {
            // Updated to use real endpoint
            const res = await api.put('/user/profile', data);
            
            // Update local state with response from backend
            const updatedUser = res.data.user;
            auth.setUser(updatedUser);
            setUser(updatedUser);
            toast.success("Perfil actualizado correctamente");
            
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar el perfil");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="container mx-auto p-6 max-w-2xl">
                <Skeleton className="h-10 w-48 mb-8" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>Actualiza tus datos de usuario aquí.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input id="name" {...register('name', { required: true })} />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" {...register('email', { required: true })} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">El correo no se puede cambiar por seguridad.</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};
