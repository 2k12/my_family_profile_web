import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
            const res = await api.put('/user/profile', data);
            
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
            <div className="container mx-auto p-6 max-w-lg space-y-8">
                <div className="flex flex-col items-center space-y-4">
                     <Skeleton className="h-24 w-24 rounded-full" />
                     <Skeleton className="h-8 w-48" />
                </div>
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
                    </CardContent>
                </Card>
            </div>
        );
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="container mx-auto p-6 max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                     <div className="absolute bottom-0 right-0 h-6 w-6 bg-green-500 rounded-full border-2 border-background" title="Online" />
                </div>
                
                <div className="text-center space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                    <p className="text-muted-foreground text-sm">{user.email}</p>
                    <div className="pt-2">
                         <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider">
                            {user.role}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Profile Edit Card */}
            <Card className="shadow-sm border-muted/60">
                <CardHeader>
                    <CardTitle className="text-lg">Información Personal</CardTitle>
                    <CardDescription>
                        Gestiona tu información básica y preferencias de cuenta.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input 
                                id="name" 
                                {...register('name', { required: true })} 
                                className="bg-background"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input 
                                id="email" 
                                {...register('email', { required: true })} 
                                disabled 
                                className="bg-muted text-muted-foreground" 
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Contacta al administrador para cambiar tu correo.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end pt-2">
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};
