import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { FormStructure } from '@/types';
import { SectionManager } from './SectionManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, RefreshCcw, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export const FormBuilderLayout = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form, setForm] = useState<FormStructure | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // New Section Dialog State
    const [isNewSectionOpen, setIsNewSectionOpen] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    const [newSectionOrder, setNewSectionOrder] = useState('');
    const [newSectionIsTemplate, setNewSectionIsTemplate] = useState(false);
    const [creatingSection, setCreatingSection] = useState(false);

    // Edit Section Dialog State
    const [isEditSectionOpen, setIsEditSectionOpen] = useState(false);
    const [editSectionId, setEditSectionId] = useState<number | null>(null);
    const [editSectionName, setEditSectionName] = useState('');
    const [editSectionIsTemplate, setEditSectionIsTemplate] = useState(false);
    const [updatingSection, setUpdatingSection] = useState(false);
    
    // Confirmation Dialog State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState({ title: '', description: '' });

    // Edit Form Meta Dialog
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [editFormName, setEditFormName] = useState('');
    const [editFormDesc, setEditFormDesc] = useState('');
    const [editFormVer, setEditFormVer] = useState('');
    const [updatingForm, setUpdatingForm] = useState(false);

    const loadForm = async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/admin/forms/${id}/full`);
            setForm(res.data);
            // Init edit state
            setEditFormName(res.data.name);
            setEditFormDesc(res.data.description || '');
            setEditFormVer(res.data.version || '1.0');
        } catch (err) {
            console.error(err);
            setError('No se pudo cargar el formulario. Es posible que no exista.');
            setForm(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadForm();
    }, [id]);

    const handleCreateSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form || !newSectionName.trim()) return;
        
        setCreatingSection(true);
        try {
            await api.post(`/admin/forms/${form.id}/sections`, { 
                name: newSectionName,
                is_template: newSectionIsTemplate
            });
            setNewSectionName('');
            setNewSectionIsTemplate(false);
            setIsNewSectionOpen(false);
            loadForm();
            toast.success("Sección creada");
        } catch (e) {
            toast.error("Error creando sección");
        } finally {
            setCreatingSection(false);
        }
    };



    const executeSectionUpdate = async () => {
        if (!editSectionId || !editSectionName.trim()) return;
        setUpdatingSection(true);
        try {
            await api.put(`/admin/sections/${editSectionId}`, {
                name: editSectionName,
                is_template: editSectionIsTemplate
            });
            toast.success("Sección actualizada");
            setIsEditSectionOpen(false);
            setIsConfirmOpen(false); // Ensure confirm is closed
            loadForm();
        } catch (e) {
            console.error(e);
            toast.error("Error al actualizar sección");
        } finally {
            setUpdatingSection(false);
        }
    };

    const handleUpdateSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editSectionId || !editSectionName.trim()) return;
        
        // Find original section to check for changes
        const originalSection = form?.sections.find(s => s.id === editSectionId);
        if (originalSection && originalSection.is_template !== editSectionIsTemplate) {
            const title = editSectionIsTemplate 
                ? "¿Convertir en Plantilla?"
                : "¿Quitar propiedad de Plantilla?";
            const description = editSectionIsTemplate
                ? "Esto hará que la sección y sus campos sean repetibles. Esto cambia significativamente la estructura de los datos."
                : "Esto hará que la sección deje de ser repetible. Los datos asociados a repeticiones podrían perderse o ser inaccesibles.";
            
            setConfirmMessage({ title, description });
            setIsConfirmOpen(true);
            return;
        }

        // No sensitive changes, proceed
        executeSectionUpdate();
    };

    const handleUpdateForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form) return;
        setUpdatingForm(true);
        try {
            await api.put(`/admin/forms/${form.id}`, {
                name: editFormName,
                description: editFormDesc,
                version: editFormVer
            });
            toast.success("Formulario actualizado");
            setIsEditFormOpen(false);
            loadForm();
        } catch (e) {
            console.error(e);
            toast.error("Error al actualizar");
        } finally {
            setUpdatingForm(false);
        }
    };

    if (!id) {
         return <div className="p-6">ID de formulario no especificado.</div>;
    }

    return (
        <div className="container mx-auto p-6 max-w-5xl min-h-screen bg-background text-foreground">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/forms')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                             <h1 className="text-2xl font-bold tracking-tight">Editor: {form?.name}</h1>
                             <span className="text-xs bg-secondary px-2 py-1 rounded-full text-secondary-foreground">v{form?.version}</span>
                        </div>
                        {form && <p className="text-muted-foreground">{form.description || 'Sin descripción'}</p>}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsEditFormOpen(true)} variant="outline" size="sm">
                        Editar Info
                    </Button>
                    <Button onClick={loadForm} variant="outline" size="sm">
                        <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
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
                    <Skeleton className="h-10 w-full max-w-md" />
                    <Skeleton className="h-64 w-full" />
                </div>
            )}

            {form && (
                <div className="space-y-6">
                    <div className="bg-muted/30 p-4 rounded-lg border flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Secciones</h2>
                            <p className="text-sm text-muted-foreground">Administra las secciones y campos de la ficha.</p>
                        </div>
                        <Button onClick={() => setIsNewSectionOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Sección
                        </Button>
                    </div>

                    <SectionManager 
                        sections={form.sections} 
                        onRefresh={loadForm} 
                        onEditSection={(section) => {
                            setEditSectionId(section.id || null);
                            setEditSectionName(section.name);
                            setEditSectionIsTemplate(section.is_template || false);
                            setIsEditSectionOpen(true);
                        }}
                    />
                </div>
            )}
            
            {/* New Section Dialog */}
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

                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="col-start-2 col-span-3 flex items-center space-x-2">
                                     <input 
                                        type="checkbox"
                                        id="isTemplate"
                                        checked={newSectionIsTemplate}
                                        onChange={(e) => setNewSectionIsTemplate(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                     />
                                     <Label htmlFor="isTemplate" className="font-normal cursor-pointer">
                                        Es Plantilla / Repetible
                                     </Label>
                                </div>
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

            <Dialog open={isEditSectionOpen} onOpenChange={setIsEditSectionOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Sección</DialogTitle>
                        <DialogDescription>
                            Modifica el nombre o la configuración de plantilla de la sección.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateSection}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="editSecName" className="text-right">
                                    Nombre
                                </Label>
                                <Input
                                    id="editSecName"
                                    value={editSectionName}
                                    onChange={(e) => setEditSectionName(e.target.value)}
                                    className="col-span-3"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="col-start-2 col-span-3 flex items-center space-x-2">
                                     <input 
                                        type="checkbox"
                                        id="editSecIsTemplate"
                                        checked={editSectionIsTemplate}
                                        onChange={(e) => setEditSectionIsTemplate(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                     />
                                     <Label htmlFor="editSecIsTemplate" className="font-normal cursor-pointer">
                                        Es Plantilla / Repetible
                                     </Label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsEditSectionOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={updatingSection || !editSectionName.trim()}>
                                {updatingSection ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Información del Formulario</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateForm}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="formName">Nombre</Label>
                                <Input
                                    id="formName"
                                    value={editFormName}
                                    onChange={(e) => setEditFormName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="formDesc">Descripción</Label>
                                <Input
                                    id="formDesc"
                                    value={editFormDesc}
                                    onChange={(e) => setEditFormDesc(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="formVer">Versión</Label>
                                <Input
                                    id="formVer"
                                    value={editFormVer}
                                    onChange={(e) => setEditFormVer(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsEditFormOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={updatingForm}>Guardar Cambios</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmMessage.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmMessage.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={executeSectionUpdate}>
                            Continuar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
