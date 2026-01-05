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
import { Edit, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function FichasListPage() {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFichas();
  }, []);

  const fetchFichas = async () => {
    try {
      setLoading(true);
      const response = await api.get("/web/fichas");
      setFichas(response.data.data); // Assuming paginated response has 'data'
    } catch (error) {
      console.error("Error fetching fichas:", error);
    } finally {
      setLoading(false);
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

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nombre Familia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Actualización</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fichas.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No se encontraron fichas.</TableCell>
                </TableRow>
            ) : (
                fichas.map((ficha) => (
                <TableRow key={ficha.id}>
                    <TableCell className="font-medium">{ficha.id}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{ficha.nombre_familia || "Sin Nombre"}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            ficha.status === 'COMPLETO' ? 'bg-green-100 text-green-800' : 
                            ficha.status === 'BORRADOR' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                            {ficha.status}
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
