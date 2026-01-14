import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { User } from '@/types';

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    onSave: (data: any) => Promise<void>;
}

export const UserDialog: React.FC<UserDialogProps> = ({ open, onOpenChange, user, onSave }) => {
    const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: 'USUARIO',
            is_active: true
        }
    });

    useEffect(() => {
        if (user) {
            reset({
                name: user.name,
                email: user.email,
                password: '', // Don't fill password on edit
                role: user.role,
                is_active: user.is_active ?? true
            });
        } else {
            reset({
                name: '',
                email: '',
                password: '',
                role: 'USUARIO',
                is_active: true
            });
        }
    }, [user, reset, open]);
    
    // Manual handling for Select and Switch since they don't work natively with register
    const role = watch('role');
    const isActive = watch('is_active');

    const onSubmit = (data: any) => {
        // If editing and password empty, remove it
        if (user && !data.password) {
            delete data.password;
        }
        onSave(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90%] max-w-[325px] sm:w-full sm:max-w-[425px] rounded-lg mx-auto p-4 md:p-6">
                <DialogHeader>
                    <DialogTitle>{user ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                        <Label htmlFor="name" className="md:text-right">Nombre</Label>
                        <Input id="name" className="col-span-1 md:col-span-3" {...register('name', { required: true })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                        <Label htmlFor="email" className="md:text-right">Email</Label>
                        <Input id="email" type="email" className="col-span-1 md:col-span-3" {...register('email', { required: true })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                        <Label htmlFor="password" className="md:text-right">Password</Label>
                        <Input 
                            id="password" 
                            type="password" 
                            className="col-span-1 md:col-span-3" 
                            placeholder={user ? "(Sin cambios)" : ""}
                            {...register('password', { required: !user })} 
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                        <Label htmlFor="role" className="md:text-right">Rol</Label>
                        <div className="col-span-1 md:col-span-3">
                            <Select onValueChange={(val) => setValue('role', val as any)} value={role}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Administrador</SelectItem>
                                    <SelectItem value="USUARIO">Usuario</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                        <Label htmlFor="is_active" className="md:text-right">Activo</Label>
                         <Switch 
                            checked={isActive}
                            onCheckedChange={(val) => setValue('is_active', val)}
                        />
                    </div>
                    
                    <div className="flex flex-row gap-2 justify-end mt-4">
                        <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
                            Cancelar
                        </Button>
                        <Button type="submit" size="sm" disabled={isSubmitting} className="flex-1 sm:flex-none">
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
