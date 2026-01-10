import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { auth } from '@/lib/auth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        const res = await api.post('/login', { email, password });
        auth.setToken(res.data.access_token);
        const user = res.data.user;
        auth.setUser(user);
        
        toast.success(`Bienvenido, ${user.name}`);
        
        if (user.role === 'ADMIN') {
            navigate('/admin/forms');
        } else {
            navigate('/bi');
        }
    } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Credenciales inválidas o error de conexión');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Bienvenido</h1>
            <p className="text-balance text-muted-foreground">
              Ingresa tu correo electrónico para acceder al sistema
            </p>
          </div>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  to="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground">
             <p>Credenciales Demo:</p>
             <p className="font-mono text-xs mt-1">prueba@example.com / 123456789</p>
             <p className="font-mono text-xs mt-1">admin@example.com / 123456789</p>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900/20 z-10" />
        <img
          src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop"
          alt="Team working"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
        <div className="absolute bottom-10 left-10 z-20 text-white p-6 backdrop-blur-sm bg-black/30 rounded-lg max-w-lg">
             <h2 className="text-2xl font-bold mb-2">Mi Perfil Familiar</h2>
             <p className="text-sm opacity-90">Plataforma integral para la gestión y análisis de fichas familiares.</p>
        </div>
      </div>
    </div>
  );
};
