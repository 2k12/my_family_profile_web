import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import type { Ficha } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function FichasListPage() {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchFichas();
  }, []);

  const fetchFichas = async () => {
    try {
      setLoading(true);
      const response = await api.get("/web/fichas");
      setFichas(response.data.data); // Assuming paginated response has 'data'
      setSelectedIds([]); // Reset selection on refresh
    } catch (error) {
      console.error("Error fetching fichas:", error);
      toast.error("Error al cargar las fichas");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedIds(fichas.map(f => f.id));
    } else {
        setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
        setSelectedIds(prev => [...prev, id]);
    } else {
        setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedIds.length === 0) return;

    try {
        setIsProcessing(true);
        await api.patch('/web/fichas/bulk-status', {
            ids: selectedIds,
            status: status
        });
        toast.success(`Se actualizaron ${selectedIds.length} fichas a ${status}`);
        fetchFichas();
    } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Error al actualizar estados");
    } finally {
        setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
        </div>
        <div className="border rounded-md">
            <div className="p-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Fichas Familiares</h2>
            <p className="text-muted-foreground">Listado de fichas registradas en el sistema.</p>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
          <div className="bg-muted p-4 rounded-md flex items-center justify-between border animate-in fade-in slide-in-from-top-2">
              <span className="font-medium text-sm">{selectedIds.length} seleccionados</span>
              <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleBulkStatusChange('verified')}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Verificar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleBulkStatusChange('pending')}
                    disabled={isProcessing}
                     className="gap-2"
                  >
                      <Clock className="h-4 w-4 text-yellow-600" />
                      Marcar Pendiente
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleBulkStatusChange('rejected')}
                    disabled={isProcessing}
                     className="gap-2"
                  >
                        <XCircle className="h-4 w-4 text-red-600" />
                        Rechazar
                  </Button>
              </div>
          </div>
      )}

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={fichas.length > 0 && selectedIds.length === fichas.length}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    aria-label="Seleccionar todo"
                  />
              </TableHead>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Nombre Familia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Actualización</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fichas.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No se encontraron fichas.</TableCell>
                </TableRow>
            ) : (
                fichas.map((ficha) => (
                <TableRow key={ficha.id} data-state={selectedIds.includes(ficha.id) ? "selected" : undefined}>
                    <TableCell>
                        <Checkbox 
                            checked={selectedIds.includes(ficha.id)}
                            onCheckedChange={(checked) => handleSelectRow(ficha.id, !!checked)}
                            aria-label={`Seleccionar ficha ${ficha.id}`}
                        />
                    </TableCell>
                    <TableCell className="font-medium">{ficha.id}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{ficha.nombre_familia || "Sin Nombre"}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            ficha.status === 'verified' ? 'bg-green-100 text-green-800' : 
                            ficha.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            ficha.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                            {ficha.status === 'verified' ? 'Verificado' : 
                             ficha.status === 'pending' ? 'Pendiente' : 
                             ficha.status === 'rejected' ? 'Rechazado' : ficha.status}
                        </span>
                    </TableCell>
                    <TableCell>{new Date(ficha.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to={`/admin/fichas/${ficha.id}/edit`}>
                        <Edit className="h-4 w-4" />
                        </Link>
                    </Button>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
