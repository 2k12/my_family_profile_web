import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface FormSummary {
  id: number;
  name: string;
  description?: string;
}

export function FormsListPage() {
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVersion, setNewVersion] = useState("1.0");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const loadForms = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/forms");
      setForms(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los formularios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    try {
      const res = await api.post("/admin/forms", {
        name: newName,
        description: newDesc,
        version: newVersion
      });
      toast.success("Formulario creado correctamente");
      setIsCreateOpen(false);
      setNewName("");
      setNewDesc("");
      setNewVersion("1.0");
      navigate(`/admin/forms/${res.data.id}`);
    } catch (error) {
        console.error(error);
      toast.error("Error al crear el formulario");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formularios</h1>
          <p className="text-muted-foreground">Administra y configura las fichas de datos.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={() => navigate('/admin/iso8000')} className="w-full sm:w-auto">
                <FileText className="mr-2 h-4 w-4" /> ISO 8000
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Formulario
            </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card key={form.id} className="flex flex-col hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/admin/forms/${form.id}`)}>
              <CardHeader className="flex-1">
                <div className="flex items-start justify-between">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary mb-4">
                        <FileText className="h-6 w-6" />
                    </div>
                </div>
                <CardTitle>{form.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {form.description || "Sin descripción"}
                </CardDescription>
              </CardHeader>
              <CardFooter className="border-t pt-4 bg-muted/50">
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={(e) => { e.stopPropagation(); navigate(`/admin/forms/${form.id}`); }}>
                      <Settings className="mr-2 h-4 w-4" /> Configurar Campos
                  </Button>
              </CardFooter>
            </Card>
          ))}
          {forms.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                No hay formularios creados.
            </div>
          )}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[90%] max-w-[325px] sm:w-full sm:max-w-[425px] rounded-lg mx-auto p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Formulario</DialogTitle>
            <DialogDescription>
              Define el nombre y descripción para la nueva ficha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Ficha de Salud"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descripción (Opcional)</Label>
                <Input
                  id="desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Breve descripción del propósito..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Versión</Label>
                <Input
                  id="version"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="1.0"
                />
              </div>
            </div>
            <div className="flex flex-row gap-2 justify-end mt-4">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)} className="flex-1 sm:flex-none">
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={creating} className="flex-1 sm:flex-none">
                {creating ? "Creando..." : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
