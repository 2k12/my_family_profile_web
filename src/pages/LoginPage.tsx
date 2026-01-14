import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { auth } from '@/lib/auth';
import { toast } from 'sonner';
import { Loader2, LayoutDashboard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="w-full min-h-screen bg-slate-50 lg:bg-background lg:grid lg:grid-cols-2">
      {/* Mobile Banner */}
      <div className="relative h-[35vh] w-full lg:hidden block">
         <div className="absolute inset-0 bg-primary/90 mix-blend-multiply z-10" />
         <img
          src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop"
          alt="Banner"
          className="h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-white pb-8">
             <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                 <LayoutDashboard className="h-8 w-8 text-white" />
             </div>
             <h2 className="text-2xl font-bold tracking-tight">Mi Perfil Familiar</h2>
             <p className="text-sm opacity-80 font-medium">Gestión Integral</p>
        </div>
      </div>

      <div className="flex items-start lg:items-center justify-center px-4 -mt-12 lg:mt-0 relative z-20 pb-12">
        <Card className="w-full max-w-[400px] shadow-xl border-none lg:shadow-none lg:border-none bg-white/95 backdrop-blur-sm lg:bg-transparent">
        <CardContent className="p-6 sm:p-8 grid gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Bienvenido</h1>
            <p className="text-sm text-balance text-muted-foreground">
              Ingresa tus credenciales para continuar
            </p>
          </div>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2 text-left">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@ejemplo.com"
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
          
          {/* 
          <div className="bg-muted/50 p-4 rounded-lg border text-center text-sm">
             ... credentials ...
          </div> 
          */}
        </CardContent>
        </Card>
      </div>
      
      {/* Desktop Image Section */}
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
