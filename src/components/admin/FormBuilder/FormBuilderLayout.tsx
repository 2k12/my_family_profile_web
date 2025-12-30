import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { FormStructure } from '@/types';
import { SectionManager } from './SectionManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, RefreshCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export const FormBuilderLayout = () => {
    const [formId, setFormId] = useState<string>('1');
    const [form, setForm] = useState<FormStructure | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // New Section Dialog State
    const [isNewSectionOpen, setIsNewSectionOpen] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    const [creatingSection, setCreatingSection] = useState(false);

    const loadForm = async () => {
        if (!formId) return;
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/admin/forms/${formId}/full`);
            setForm(res.data);
        } catch (err) {
            console.error(err);
            setError('No se pudo cargar el formulario. Asegúrate que existe el ID.');
            setForm(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadForm();
    }, []);

    const handleCreateSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form || !newSectionName.trim()) return;
        
        setCreatingSection(true);
        try {
            await api.post(`/admin/forms/${form.id}/sections`, { name: newSectionName });
            setNewSectionName('');
            setIsNewSectionOpen(false);
            loadForm();
            toast.success("Sección creada");
        } catch (e) {
            toast.error("Error creando sección");
        } finally {
            setCreatingSection(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl min-h-screen bg-background text-foreground">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Form Builder</h1>
                    <p className="text-muted-foreground">Gestiona la estructura de las fichas familiares.</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <Input 
                        className="w-20" 
                        value={formId} 
                        onChange={(e) => setFormId(e.target.value)} 
                        placeholder="ID"
                    />
                    <Button onClick={loadForm} variant="outline" size="icon">
                        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </header>

            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            {loading && !form && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <Skeleton className="h-8 w-64" />
                         <Skeleton className="h-10 w-32" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            )}

            {form && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Ficha: {form.name}</h2>
                        <Button onClick={() => setIsNewSectionOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Sección
                        </Button>
                    </div>

                    <SectionManager sections={form.sections} onRefresh={loadForm} />
                </div>
            )}
            
            {!form && !loading && !error && (
                <div className="text-center py-12 text-muted-foreground">
                    Ingresa un ID de formulario para comenzar.
                </div>
            )}

            <Dialog open={isNewSectionOpen} onOpenChange={setIsNewSectionOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nueva Sección</DialogTitle>
                        <DialogDescription>
                            Crea una nueva sección para agrupar campos en el formulario.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSection}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Nombre
                                </Label>
                                <Input
                                    id="name"
                                    value={newSectionName}
                                    onChange={(e) => setNewSectionName(e.target.value)}
                                    className="col-span-3"
                                    placeholder="Ej: Datos Personales"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsNewSectionOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={creatingSection || !newSectionName.trim()}>
                                {creatingSection ? 'Creando...' : 'Crear Sección'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
