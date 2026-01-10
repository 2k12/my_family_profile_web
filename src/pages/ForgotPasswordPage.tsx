import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        await api.post('/forgot-password', { email });
        setSubmitted(true);
        toast.success('Si el correo existe, recibirás un enlace de recuperación.');
    } catch (err: any) {
        console.error(err);
        // We generally don't want to show specific errors for security, but connection errors are fine
        toast.error('Ocurrió un error al procesar la solicitud.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Recuperar Contraseña</h1>
            <p className="text-balance text-muted-foreground">
              {!submitted 
                ? "Ingresa tu correo para recibir instrucciones" 
                : "Revisa tu correo electrónico"}
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="grid gap-4">
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </Button>
            </form>
          ) : (
             <div className="grid gap-4">
                <div className="bg-muted/50 p-4 rounded-lg text-sm text-center">
                    Hemos enviado las instrucciones a <strong>{email}</strong>. 
                    Por favor revisa tu bandeja de entrada o spam.
                </div>
                <Button variant="outline" className="w-full" onClick={() => setSubmitted(false)}>
                    Intentar con otro correo
                </Button>
             </div>
          )}

          <div className="text-center text-sm">
             <Link to="/login" className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
             </Link>
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
      </div>
    </div>
  );
};
