import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (tokenParam) setToken(tokenParam);
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== passwordConfirmation) {
        toast.error('Las contraseñas no coinciden');
        return;
    }

    if (password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    setLoading(true);
    
    try {
        await api.post('/reset-password', { 
            token, 
            email, 
            password,
            password_confirmation: passwordConfirmation 
        });
        toast.success('Contraseña restablecida exitosamente');
        navigate('/login');
    } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Error al restablecer contraseña');
    } finally {
        setLoading(false);
    }
  };

  if (!token || !email) {
      return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h2 className="text-lg font-bold">Enlace inválido</h2>
                <p className="text-muted-foreground mb-4">Faltan parámetros necesarios en el enlace.</p>
                <Link to="/login">
                    <Button>Ir al login</Button>
                </Link>
            </div>
        </div>
      );
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Nueva Contraseña</h1>
            <p className="text-balance text-muted-foreground">
              Ingresa tu nueva contraseña
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password_confirmation">Confirmar Contraseña</Label>
              <Input
                id="password_confirmation"
                type="password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Guardando...' : 'Restablecer Contraseña'}
            </Button>
          </form>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900/20 z-10" />
        <img
          src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop"
          alt="Team working"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
};
