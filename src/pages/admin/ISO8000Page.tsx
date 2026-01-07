import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface FormSummary {
    id: number;
    name: string;
}

interface FieldDef {
    id: number;
    name: string; // ISO Identifier
    label: string; // Visual Label
    type: string;
    required: boolean;
    dynamic_source?: string;
    options?: any[];
}

interface SectionDef {
    id: number;
    name: string;
    fields: FieldDef[];
}

interface FullForm {
    id: number;
    name: string;
    sections: SectionDef[];
}

export const ISO8000Page = () => {
    const navigate = useNavigate();
    const [forms, setForms] = useState<FormSummary[]>([]);
    const [selectedFormId, setSelectedFormId] = useState<string>('');
    const [formData, setFormData] = useState<FullForm | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/admin/forms').then(res => setForms(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedFormId) {
            setLoading(true);
            api.get(`/admin/forms/${selectedFormId}/full`).then(res => {
                setFormData(res.data);
            }).catch(e => {
                console.error(e);
                toast.error("Error cargando formulario");
            }).finally(() => setLoading(false));
        }
    }, [selectedFormId]);

    const getSemanticDefinition = (field: FieldDef) => {
        // Since DB doesn't have description, we infer or use placeholders
        return "Campo de datos del formulario."; 
    };

    const getSyntaxRules = (field: FieldDef) => {
        let rules = [`Tipo: ${field.type}`];
        if (field.required) rules.push("Obligatorio: Sí");
        else rules.push("Obligatorio: No");

        if (field.type === 'number') rules.push("Validación: Solo dígitos.");
        if (field.type === 'date') rules.push("Formato: YYYY-MM-DD.");
        if (field.type === 'select' || field.type === 'radio') rules.push("Selección de lista predefinida.");
        
        if (field.dynamic_source) {
            rules.push(`Fuente Dinámica: ${field.dynamic_source}`);
        }

        return rules.join('\n');
    };

    const handleExportPDF = () => {
        if (!formData) return;
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text(`Reporte Cumplimiento ISO 8000 - ${formData.name}`, 14, 20);
        
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 28);

        const rows: any[] = [];

        formData.sections.forEach(section => {
            // Section Header Row
            rows.push([{ content: `SECCIÓN: ${section.name}`, colSpan: 4, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
            
            section.fields.forEach(field => {
                rows.push([
                    field.name,
                    field.label,
                    getSemanticDefinition(field),
                    getSyntaxRules(field)
                ]);
            });
        });

        autoTable(doc, {
            startY: 35,
            head: [['Identificador (ISO 8000-110)', 'Etiqueta Visual', 'Definición Semántica', 'Reglas Sintaxis/Calidad']],
            body: rows,
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
                0: { cellWidth: 30 }, // ID
                1: { cellWidth: 40 }, // Label
                2: { cellWidth: 50 }, // Definition
                3: { cellWidth: 'auto' } // Rules
            }
        });

        doc.save(`ISO8000_${formData.name.replace(/\s/g, '_')}.pdf`);
        toast.success("PDF Generado");
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl min-h-screen bg-background text-foreground">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/forms')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                   <h1 className="text-2xl font-bold tracking-tight">Cumplimiento ISO 8000</h1>
                   <p className="text-muted-foreground">Diccionario de Datos y Reglas de Calidad</p>
                </div>
            </div>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Selección de Formulario</CardTitle>
                    <CardDescription>Elija un formulario para visualizar su diccionario de datos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select onValueChange={setSelectedFormId} value={selectedFormId}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Seleccione un formulario" />
                        </SelectTrigger>
                        <SelectContent>
                            {forms.map(f => (
                                <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {formData && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Diccionario de Datos: {formData.name}</CardTitle>
                        <Button onClick={handleExportPDF} variant="outline">
                            <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[150px]">Identificador</TableHead>
                                    <TableHead className="w-[200px]">Etiqueta Visual</TableHead>
                                    <TableHead className="w-[250px]">Definición Semántica</TableHead>
                                    <TableHead>Reglas de Sintaxis y Calidad</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {formData.sections.map(section => (
                                    <React.Fragment key={section.id}>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableCell colSpan={4} className="font-bold py-2">
                                                SECCIÓN: {section.name}
                                            </TableCell>
                                        </TableRow>
                                        {section.fields.map(field => (
                                            <TableRow key={field.id}>
                                                <TableCell className="font-mono text-xs">{field.name}</TableCell>
                                                <TableCell>{field.label}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{getSemanticDefinition(field)}</TableCell>
                                                <TableCell className="whitespace-pre-wrap text-xs">{getSyntaxRules(field)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
