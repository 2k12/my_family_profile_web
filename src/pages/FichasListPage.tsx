import { useState, useEffect, useCallback } from "react";
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
import { Edit, FileText, CheckCircle, XCircle, Clock, FileSpreadsheet, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function FichasListPage() {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchFichas(currentPage);
  }, [currentPage]);

  const fetchFichas = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/web/fichas?page=${page}`);
      setFichas(response.data.data);
      setCurrentPage(response.data.current_page);
      setLastPage(response.data.last_page);
      setTotal(response.data.total);
      setSelectedIds([]);
    } catch (error) {
      console.error("Error fetching fichas:", error);
      toast.error("Error al cargar las fichas");
    } finally {
      setLoading(false);
    }
  }, []);

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
      fetchFichas(currentPage);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar estados");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      toast.loading("Generando Excel...", { id: "export-excel" });

      const response = await api.get("/web/fichas/export/excel", {
        responseType: "blob",
      });

      // Extraer nombre de archivo de la cabecera, con fallback
      const disposition = response.headers["content-disposition"] as string | undefined;
      const match = disposition?.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] || `Fichas_Familiares_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Excel exportado correctamente", { id: "export-excel" });
    } catch (error) {
      console.error("Error exporting excel:", error);
      toast.error("Error al exportar el Excel", { id: "export-excel" });
    } finally {
      setIsExporting(false);
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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fichas Familiares</h2>
          <p className="text-muted-foreground">Listado de fichas registradas en el sistema.</p>
        </div>
        <Button
          onClick={handleExportExcel}
          disabled={isExporting}
          className="gap-2 w-full sm:w-auto"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          {isExporting ? "Exportando..." : "Exportar Excel"}
        </Button>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-muted p-4 rounded-md flex flex-col md:flex-row items-center justify-between border animate-in fade-in slide-in-from-top-2 gap-3">
          <span className="font-medium text-sm">{selectedIds.length} seleccionados</span>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusChange('verified')}
              disabled={isProcessing}
              className="gap-2 w-full sm:w-auto"
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
              Verificar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusChange('pending')}
              disabled={isProcessing}
              className="gap-2 w-full sm:w-auto"
            >
              <Clock className="h-4 w-4 text-yellow-600" />
              Marcar Pendiente
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusChange('rejected')}
              disabled={isProcessing}
              className="gap-2 w-full sm:w-auto"
            >
              <XCircle className="h-4 w-4 text-red-600" />
              Rechazar
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-md bg-card hidden md:block">
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
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ficha.status === 'verified' ? 'bg-green-100 text-green-800' :
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
                    <div className="flex items-center -space-x-px text-right justify-end">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-md focus:z-10"
                        asChild
                      >
                        <Link to={`/admin/fichas/${ficha.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {fichas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-card">
            No se encontraron fichas.
          </div>
        ) : (
          fichas.map((ficha) => (
            <div
              key={ficha.id}
              className={`p-4 rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col gap-3 ${selectedIds.includes(ficha.id) ? 'ring-2 ring-primary' : ''}`}
              onClick={() => handleSelectRow(ficha.id, !selectedIds.includes(ficha.id))}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedIds.includes(ficha.id)}
                    onCheckedChange={(checked) => handleSelectRow(ficha.id, !!checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">#{ficha.id}</span>
                      {ficha.nombre_familia || "Sin Nombre"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Actualizado: {new Date(ficha.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center -space-x-px">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-md focus:z-10"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link to={`/admin/fichas/${ficha.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ficha.status === 'verified' ? 'bg-green-100 text-green-800' :
                    ficha.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      ficha.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                  {ficha.status === 'verified' ? 'Verificado' :
                    ficha.status === 'pending' ? 'Pendiente' :
                      ficha.status === 'rejected' ? 'Rechazado' : ficha.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Mostrando página {currentPage} de {lastPage} ({total} fichas en total)
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-disabled={currentPage <= 1}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {(() => {
                const pages: React.ReactNode[] = [];
                const delta = 1;
                const range: number[] = [];

                for (let i = 1; i <= lastPage; i++) {
                  if (i === 1 || i === lastPage || (i >= currentPage - delta && i <= currentPage + delta)) {
                    range.push(i);
                  }
                }

                let prev: number | null = null;
                for (const i of range) {
                  if (prev !== null && i - prev > 1) {
                    pages.push(
                      <PaginationItem key={`ellipsis-${prev}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  pages.push(
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={i === currentPage}
                        onClick={() => setCurrentPage(i)}
                        className="cursor-pointer"
                      >
                        {i}
                      </PaginationLink>
                    </PaginationItem>
                  );
                  prev = i;
                }
                return pages;
              })()}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                  aria-disabled={currentPage >= lastPage}
                  className={currentPage >= lastPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
