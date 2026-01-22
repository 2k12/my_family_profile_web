import { useEffect, useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form'; 
import { useFormSchema } from '@/hooks/useFormSchema';
import { Button } from '@/components/ui/button';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FieldSwitch } from './FieldSwitch';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrayField } from './fields/ArrayField';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateFichaPDF } from "@/lib/pdf-generator";
import { FileText, Smartphone, MapPin, Info, Calendar, Trophy, CheckCircle2, AlertTriangle, XOctagon, ClipboardList, Activity } from "lucide-react"; 
import { DataQualityService } from '@/lib/DataQualityService';

// Define the shape of the form data
interface FichaFormData {
    nombre_familia: string;
    status: string; // Added status
    [key: string]: any; 
}

export function DynamicForm() {
    const { id } = useParams<{ id: string }>();
    const formId = 1; 
    
    const { isLoading, schema, defaultValues, ficha } = useFormSchema(formId, id || '');
    const navigate = useNavigate();

    const methods = useForm<FichaFormData>({
        defaultValues: {}, 
    });

    // ISO 8000 Data Quality State
    const [qualityScore, setQualityScore] = useState(0);
    const [qualityReport, setQualityReport] = useState<any>(null);
    const allValues = methods.watch();

    // Use JSON.stringify to avoid infinite loops due to object reference changes
    const allValuesString = JSON.stringify(allValues);

    useEffect(() => {
        if (schema && allValues) {
             const result = DataQualityService.analyze(schema, allValues);
             setQualityScore((prev) => {
                 if (prev !== result.score) return result.score;
                 return prev;
             });
             setQualityReport((prev: any) => {
                 if (JSON.stringify(prev) !== JSON.stringify(result.report)) return result.report;
                 return prev;
             });
        }
    }, [allValuesString, schema]);

    useEffect(() => {
        if (!isLoading && ficha) {
            let rawStatus = (ficha.status || 'pending');
            // Normalize: to string, lowercase, and trim whitespace
            let status = String(rawStatus).toLowerCase().trim();
            
            // Map legacy/Spanish values to English keys
            const statusMap: Record<string, string> = {
                'pendiente': 'pending',
                'verificado': 'verified',
                'rechazado': 'rejected',
                'borrador': 'pending',
                'completo': 'verified',
                // Identity mapping for safety
                'pending': 'pending',
                'verified': 'verified',
                'rejected': 'rejected'
            };
            
            if (statusMap[status]) {
                status = statusMap[status];
            } else {
                // If the status is unknown (e.g. "Draft"), default to pending to avoid empty dropdown
                console.warn(`Unknown status "${rawStatus}" normalized to "${status}". Defaulting to "pending".`);
                status = 'pending';
            }

            const formData = {
                ...(defaultValues || {}),
                ...(ficha.datos || {}), // Merge dynamic data from DB
                nombre_familia: ficha.nombre_familia || '',
                status: status
            };
            methods.reset(formData);
        }
    }, [isLoading, defaultValues, ficha, methods]);

    // Watch for changes in arrays to update their corresponding count/range fields
    const miembrosFallecidosData = methods.watch('miembros_fallecidos_data');
    const problemasAmbientalesData = methods.watch('problemas_ambientales_data');
    const tratamientoData = methods.watch('personas_lugares_tratamiento_data');
    const miembrosGeneralesData = methods.watch('miembros_generales_data'); 

    useEffect(() => {
        if (Array.isArray(miembrosFallecidosData)) {
            methods.setValue('miembros_fallecidos', String(miembrosFallecidosData.length));
        }
    }, [miembrosFallecidosData, methods]);

    useEffect(() => {
        if (Array.isArray(miembrosGeneralesData)) {
            // Try updating likely field names for total members
            methods.setValue('miembros_generales', String(miembrosGeneralesData.length));
            methods.setValue('numero_miembros', String(miembrosGeneralesData.length));
        }
    }, [miembrosGeneralesData, methods]);

    useEffect(() => {
        if (Array.isArray(problemasAmbientalesData)) {
            methods.setValue('problemas_ambientales', String(problemasAmbientalesData.length));
        }
    }, [problemasAmbientalesData, methods]);

    useEffect(() => {
        if (Array.isArray(tratamientoData)) {
             methods.setValue('personas_lugares_tratamiento', String(tratamientoData.length));
        }
    }, [tratamientoData, methods]);


    const onSubmit = async (data: any) => {
        try {
            // Mapping: nombre_familia column comes from familia_identificador
            // We ensure 'nombre_familia' is NOT in 'datos'
            const { nombre_familia, status, ...datos } = data;
            
            // If familia_identificador exists in datos, use it for the column
            const finalNombreFamilia = datos.nombre_familia_identificador || nombre_familia; 

            // Explicitly ensure 'nombre_familia' is removed from datos if it was there (destructuring handles it)
            // And ensure we don't accidentally put it back
            
            await api.put(`/web/fichas/${id}`, { 
                datos: datos,
                nombre_familia: finalNombreFamilia,
                status: status
            });
            toast.success('Ficha actualizada correctamente');
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar la ficha');
        }
    };

    if (isLoading) return <Skeleton className="h-[500px] w-full" />;
    if (!schema) return <div>No se pudo cargar la estructura del formulario.</div>;

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6 container mx-auto p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                     <div>
                         <h2 className="text-2xl font-bold tracking-tight">Editar Ficha: {ficha?.nombre_familia || id}</h2>
                         <p className="text-muted-foreground mb-2">Complete la información requerida.</p>
                         
                          {/* Data Quality Indicator */}
                          <Dialog>
                            <DialogTrigger asChild>
                                 <div className="flex items-center gap-2 mt-2 cursor-pointer group">
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-sm",
                                        qualityScore === 100 ? "bg-green-50 text-green-700 border-green-200 group-hover:bg-green-100" :
                                        qualityScore >= 70 ? "bg-amber-50 text-amber-700 border-amber-200 group-hover:bg-amber-100" :
                                        "bg-red-50 text-red-700 border-red-200 group-hover:bg-red-100"
                                    )}>
                                        <Activity className="h-3.5 w-3.5" />
                                        <span>Calidad ISO: {qualityScore}%</span>
                                    </div>
                                    <div className="hidden sm:block h-2 w-24 bg-slate-100 rounded-full overflow-hidden border">
                                        <div 
                                            className={cn("h-full transition-all duration-1000 ease-out", 
                                                qualityScore < 70 ? "bg-red-500" :
                                                qualityScore < 100 ? "bg-amber-500" : "bg-green-500"
                                            )} 
                                            style={{ width: `${qualityScore}%` }}
                                        />
                                    </div>
                                 </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
                                <div className={cn(
                                    "p-6 border-b flex items-start justify-between bg-muted/30",
                                    qualityScore === 100 ? "bg-green-50/50" : qualityScore < 70 ? "bg-red-50/50" : "bg-amber-50/50"
                                )}>
                                    <div>
                                        <DialogHeader className="p-0 space-y-1">
                                            <DialogTitle className="text-xl flex items-center gap-2">
                                                <Trophy className={cn("h-5 w-5", qualityScore === 100 ? "text-yellow-600" : "text-slate-500")} />
                                                Reporte de Calidad ISO 8000
                                            </DialogTitle>
                                            <DialogDescription className="text-base text-muted-foreground">
                                                Análisis de conformidad, sintaxis y completitud de datos.
                                            </DialogDescription>
                                        </DialogHeader>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30">
                                    {qualityReport && (
                                        <>
                                            {/* Metrics Cards */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <Card className="shadow-sm border-slate-200">
                                                    <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                                                        <div className="p-2 bg-slate-100 rounded-full"><ClipboardList className="h-5 w-5 text-slate-600" /></div>
                                                        <div>
                                                            <div className="text-2xl font-bold tracking-tight">{qualityReport.total_fields}</div>
                                                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Campos</div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                
                                                <Card className="shadow-sm border-red-100 bg-red-50/30">
                                                    <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                                                        <div className="p-2 bg-red-100 rounded-full"><XOctagon className="h-5 w-5 text-red-600" /></div>
                                                        <div>
                                                            <div className="text-2xl font-bold tracking-tight text-red-700">{qualityReport.missing_required}</div>
                                                            <div className="text-[10px] font-semibold text-red-600/80 uppercase tracking-wider">Errores Críticos</div>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                <Card className="shadow-sm border-amber-100 bg-amber-50/30">
                                                    <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                                                        <div className="p-2 bg-amber-100 rounded-full"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
                                                        <div>
                                                            <div className="text-2xl font-bold tracking-tight text-amber-700">
                                                                {/* Example calculation for warnings if available or just placeholders */}
                                                                {(qualityReport.details?.length || 0) - qualityReport.missing_required}
                                                            </div>
                                                            <div className="text-[10px] font-semibold text-amber-600/80 uppercase tracking-wider">Advertencias</div>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                <Card className="shadow-sm border-blue-100 bg-blue-50/30">
                                                    <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                                                        <div className="p-2 bg-blue-100 rounded-full"><Activity className="h-5 w-5 text-blue-600" /></div>
                                                        <div>
                                                            <div className="text-2xl font-bold tracking-tight text-blue-700">{(qualityReport.metrics?.completeness_required * 100).toFixed(0)}%</div>
                                                            <div className="text-[10px] font-semibold text-blue-600/80 uppercase tracking-wider">Completitud</div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Detailed Issues */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-base font-semibold flex items-center gap-2">
                                                        <Info className="h-4 w-4 text-muted-foreground" />
                                                        Detalle de Hallazgos
                                                    </h4>
                                                </div>

                                                {qualityReport.details && qualityReport.details.length > 0 ? (
                                                    <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                                                        <Table>
                                                            <TableHeader className="bg-slate-50">
                                                                <TableRow>
                                                                    <TableHead className="w-[180px] font-semibold">Campo</TableHead>
                                                                    <TableHead className="font-semibold">Problema Detectado</TableHead>
                                                                    <TableHead className="w-[120px] font-semibold text-right">Impacto</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {qualityReport.details.map((issue: any, idx: number) => (
                                                                    <TableRow key={idx} className="hover:bg-slate-50/50">
                                                                        <TableCell className="font-mono text-xs font-medium text-slate-600">
                                                                            {issue.field}
                                                                        </TableCell>
                                                                        <TableCell className="text-sm">
                                                                           {issue.issue}
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                            <span className={cn(
                                                                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                                                issue.status === 'CRITICAL' ? "bg-red-50 text-red-700 ring-red-600/10" : 
                                                                                issue.status === 'WARNING' ? "bg-amber-50 text-amber-700 ring-amber-600/10" :
                                                                                "bg-slate-50 text-slate-700 ring-slate-600/10"
                                                                            )}>
                                                                                {issue.status}
                                                                            </span>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-xl bg-white text-center animate-in fade-in zoom-in-95 duration-500">
                                                        <div className="p-4 bg-green-50 rounded-full mb-4">
                                                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-green-900 mb-1">¡Datos de Alta Calidad!</h3>
                                                        <p className="text-base text-muted-foreground max-w-sm">
                                                            No se encontraron errores de sintaxis ni campos obligatorios faltantes. El registro cumple con ISO 8000.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </DialogContent>
                          </Dialog>
                     </div>
                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                         <Controller
                             control={methods.control}
                             name="status"
                             render={({ field }) => (
                                 <Select onValueChange={field.onChange} value={field.value}>
                                     <SelectTrigger className="w-full sm:w-[150px]">
                                         <SelectValue placeholder="Estado" />
                                     </SelectTrigger>
                                     <SelectContent>
                                         <SelectItem value="pending">Pendiente</SelectItem>
                                         <SelectItem value="verified">Verificado</SelectItem>
                                         <SelectItem value="rejected">Rechazado</SelectItem>
                                     </SelectContent>
                                 </Select>
                             )}
                         />
                         <Button 
                             type="button" 
                             variant="secondary" 
                             className="w-full sm:w-auto"
                             onClick={async () => {
                                 if (ficha && schema) {
                                     const toastId = toast.loading("Generando PDF...");
                                     try {
                                         await generateFichaPDF(ficha as any, schema);
                                         toast.success("PDF Generado", { id: toastId });
                                     } catch(e) {
                                         console.error(e);
                                         toast.error("Error generando PDF", { id: toastId });
                                     }
                                 } else {
                                     toast.error("No hay datos para exportar");
                                 }
                             }}
                             disabled={!ficha || !schema}
                         >
                             <FileText className="mr-2 h-4 w-4" /> PDF
                         </Button>
                         <Button type="button" variant="outline" onClick={() => navigate(-1)} className="w-full sm:w-auto">Cancelar</Button>
                         <Button type="submit" className="w-full sm:w-auto">Guardar</Button>
                     </div>
                 </div>

                     <div className="md:col-span-4 pl-1">
                         {/* Manual Nombre Familia input removed as it is now derived from familia_identificador */}
                         {/* Display current identifier if needed or just rely on the form field */}
                     </div>

                <Tabs defaultValue={schema.sections[0]?.name || ''} className="w-full">
                    <div className="w-full overflow-x-auto pb-2 -mb-2">
                        <TabsList className="w-auto inline-flex h-auto gap-2 bg-transparent p-0">
                            {schema.sections.map((section) => (
                                <TabsTrigger 
                                    key={section.id} 
                                    value={section.name}
                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background whitespace-nowrap px-4 py-2 h-9"
                                >
                                    {section.name}
                                </TabsTrigger>
                            ))}
                            <TabsTrigger 
                                value="auditoria" 
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background whitespace-nowrap px-4 py-2 h-9"
                            >
                                Auditoría
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    
                    {schema.sections.map((section) => {
                        const allFields = schema.sections.flatMap(s => s.fields);
                        
                        // Mapping sections to array keys using keywords (case-insensitive partial match)
                        const SECTION_KEYWORDS: Record<string, string> = {
                            // 'miembros': 'miembros_generales_data', // REMOVED: User wants this section as "Normal" fields
                            // 'integrantes': 'miembros_generales_data',
                            'familiares': 'miembros_generales_data', // Catches "Familiares" (Table View)
                            'especiales': 'miembros_especiales_data', // Catches "Familiares Especiales"
                            'fallecidos': 'miembros_fallecidos_data',
                            'ambiental': 'problemas_ambientales_data', 
                            'tratamiento': 'personas_lugares_tratamiento_data'
                        };

                        const normalizedSectionName = section.name.toLowerCase();
                        const arrayKey = Object.keys(SECTION_KEYWORDS).find(keyword => 
                            normalizedSectionName.includes(keyword)
                        ) ? SECTION_KEYWORDS[Object.keys(SECTION_KEYWORDS).find(keyword => 
                            normalizedSectionName.includes(keyword)
                        )!] : undefined;
                        
                        // Strict override for specific conflicts if needed, but 'miembros' vs 'especiales' order matters?
                        // 'miembros especiales' contains 'miembros' AND 'especiales'.
                        // We should prioritize specific matches.
                        
                        let finalArrayKey = arrayKey;

                        // Override for legacy hardcoded sections
                        if (normalizedSectionName.includes('especiales')) finalArrayKey = 'miembros_especiales_data';
                        if (normalizedSectionName.includes('fallecidos')) finalArrayKey = 'miembros_fallecidos_data';

                        // Generic fallback for any other template section
                        if (!finalArrayKey && section.is_template) {
                             const baseKey = normalizedSectionName
                                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                                .replace(/[^a-z0-9]/g, '_') // replace non-alphanumeric with _
                                .replace(/_+/g, '_')   // collapse multiple _
                                .replace(/^_|_$/g, ''); // trim _
                            
                            finalArrayKey = `${baseKey}_data`;
                        }

                        // User requested "Familiares" to use Card View, but others use Table View
                        const isFamiliaresTab = normalizedSectionName.includes('familiares') && 
                                               !normalizedSectionName.includes('especiales') && 
                                               !normalizedSectionName.includes('fallecidos');
                        
                        const renderMode = isFamiliaresTab ? 'cards' : 'table';

                        return (
                        <TabsContent key={section.id} value={section.name} className="mt-6">
                            <Card>
                                <CardContent className="space-y-6 pt-6">
                                    {finalArrayKey ? (
                                        // Render entire section as a Table or Cards
                                        <ArrayField 
                                            name={finalArrayKey} 
                                            label={section.name} 
                                            allFields={section.fields}
                                            renderMode={renderMode} 
                                        />
                                    ) : normalizedSectionName.includes('riesgo') ? (
                                        // Custom rendering for Riesgos to group A, B, C
                                        <div className="space-y-8">
                                            {/* Risk Score Card */}
                                            {(() => {
                                                // Calculate Score Live
                                                const riskFields = section.fields.filter(f => 
                                                    !f.label.toLowerCase().includes('fecha') && 
                                                    !f.label.toLowerCase().includes('responsable')
                                                );
                                                
                                                // We need to watch these fields. 
                                                // Using methods.watch() directly here might trigger re-renders on ANY change, which is fine for this form size.
                                                // To be precise we sum the current values.
                                                const allValues = methods.watch();
                                                const score = riskFields.reduce((acc, field) => {
                                                    const val = allValues[field.name];
                                                    // Parse value: if array (checkbox), sum items? Usually risk is radio/select single value.
                                                    // Assuming single numeric value stored as string
                                                    const num = parseInt(String(val || 0), 10);
                                                    return acc + (isNaN(num) ? 0 : num);
                                                }, 0);

                                                // Determine Level and Color
                                                // Determine Color only (Label comes from DB)
                                                let color = 'bg-green-600';
                                                let textColor = 'text-white';
                                                
                                                if (score > 0 && score <= 14) { color = 'bg-yellow-400'; textColor = 'text-black'; }
                                                else if (score >= 15 && score <= 34) { color = 'bg-orange-500'; textColor = 'text-white'; }
                                                else if (score >= 35) { color = 'bg-red-600'; textColor = 'text-white'; }

                                                return (
                                                    <div className="flex flex-col gap-4 mb-6">
                                                        <div className={cn("p-4 md:p-6 rounded-lg shadow-sm flex flex-col items-center md:items-start md:flex-row md:justify-between border gap-4 md:gap-0 mt-4", color)}>
                                                            <div className={cn("flex flex-col text-center md:text-left", textColor)}>
                                                                <span className="text-sm font-semibold uppercase opacity-90">Nivel de Riesgo</span>
                                                                <span className="text-2xl md:text-3xl font-bold">{ficha?.risk_level || 'Pendiente de Guardar'}</span>
                                                            </div>
                                                            <div className={cn("flex flex-col items-center md:items-end text-center md:text-right", textColor)}>
                                                                <span className="text-sm font-semibold uppercase opacity-90">Puntaje Actual</span>
                                                                <span className="text-4xl md:text-5xl font-black">{score}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Header Fields (Fecha, Responsable) */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {section.fields.filter(f => 
                                                    f.label.toLowerCase().includes('fecha') || 
                                                    f.label.toLowerCase().includes('responsable')
                                                ).map(field => (
                                                    <div key={field.id} className="col-span-1">
                                                        <FieldSwitch field={field} allFields={allFields} />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Group A: Biológicos */}
                                            <div className="border rounded-lg p-4 bg-slate-50/50">
                                                <h3 className="text-lg font-semibold mb-4 text-primary">A. Riesgos Biológicos</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {section.fields.filter(f => {
                                                        const l = f.label.toLowerCase();
                                                        const n = f.name.toLowerCase();
                                                        return !l.includes('fecha') && !l.includes('responsable') && 
                                                               (l.includes('a.') || l.startsWith('a ') || n.includes('biologico'));
                                                    }).map(field => (
                                                        <div key={field.id}>
                                                            <FieldSwitch field={field} allFields={allFields} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Group B: Sanitarios */}
                                            <div className="border rounded-lg p-4 bg-slate-50/50">
                                                <h3 className="text-lg font-semibold mb-4 text-primary">B. Riesgos Sanitarios</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {section.fields.filter(f => {
                                                        const l = f.label.toLowerCase();
                                                        const n = f.name.toLowerCase();
                                                        return !l.includes('fecha') && !l.includes('responsable') && 
                                                               (l.includes('b.') || l.startsWith('b ') || n.includes('sanitario') || n.includes('agua') || n.includes('basura'));
                                                    }).map(field => (
                                                        <div key={field.id}>
                                                            <FieldSwitch field={field} allFields={allFields} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Group C: Socio-Económicos */}
                                            <div className="border rounded-lg p-4 bg-slate-50/50">
                                                <h3 className="text-lg font-semibold mb-4 text-primary">C. Riesgos Socio-Económicos</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {section.fields.filter(f => {
                                                        const l = f.label.toLowerCase();
                                                        const n = f.name.toLowerCase();
                                                        return !l.includes('fecha') && !l.includes('responsable') && 
                                                               (l.includes('c.') || l.startsWith('c ') || n.includes('socio') || n.includes('econom') || n.includes('pobreza'));
                                                    }).map(field => (
                                                        <div key={field.id}>
                                                            <FieldSwitch field={field} allFields={allFields} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {/* Catch-all for any missed fields */}
                                            {section.fields.filter(f => {
                                                const l = f.label.toLowerCase();
                                                const n = f.name.toLowerCase();
                                                const isHeader = l.includes('fecha') || l.includes('responsable');
                                                const isA = l.includes('a.') || l.startsWith('a ') || n.includes('biologico');
                                                const isB = l.includes('b.') || l.startsWith('b ') || n.includes('sanitario') || n.includes('agua') || n.includes('basura');
                                                const isC = l.includes('c.') || l.startsWith('c ') || n.includes('socio') || n.includes('econom') || n.includes('pobreza');
                                                return !isHeader && !isA && !isB && !isC;
                                            }).length > 0 && (
                                                <div className="border rounded-lg p-4">
                                                    <h3 className="text-lg font-semibold mb-4">Otros</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {section.fields.filter(f => {
                                                            const l = f.label.toLowerCase();
                                                            const n = f.name.toLowerCase();
                                                            const isHeader = l.includes('fecha') || l.includes('responsable');
                                                            const isA = l.includes('a.') || l.startsWith('a ') || n.includes('biologico');
                                                            const isB = l.includes('b.') || l.startsWith('b ') || n.includes('sanitario') || n.includes('agua') || n.includes('basura');
                                                            const isC = l.includes('c.') || l.startsWith('c ') || n.includes('socio') || n.includes('econom') || n.includes('pobreza');
                                                            return !isHeader && !isA && !isB && !isC;
                                                        }).map(field => (
                                                            <div key={field.id}>
                                                                <FieldSwitch field={field} allFields={allFields} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Render standard fields
                                        // Apply Grid layout for "Información General" to avoid ultra-wide inputs through conditional class
                                        <div className={cn(
                                            "space-y-6",
                                            (normalizedSectionName.includes('general') || normalizedSectionName.includes('responsable') || normalizedSectionName.includes('llenado')) ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 space-y-0 items-start" : ""
                                        )}>
                                            {section.fields.map((field) => (
                                                <div key={field.id} className={cn(
                                                    // Span full width for specific fields like signature or long text
                                                    ['firma', 'observacion'].some(k => field.name.includes(k)) ? "col-span-full" : ""
                                                )}>
                                                    <FieldSwitch field={field} allFields={allFields} />
                                                </div>
                                            ))}
                                            {section.fields.length === 0 && <p className="text-muted-foreground italic">Esta sección no tiene campos.</p>}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )})}
                    
                    <TabsContent value="auditoria" className="mt-6">
                        <Card>
                            <CardContent className="space-y-6 pt-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Info className="h-5 w-5" /> Metadatos y Auditoría ISO
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3 p-4 border rounded-lg bg-slate-50">
                                            <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Dispositivo y Versión</p>
                                                <p className="text-sm text-slate-600">{ficha?.device_model || 'No registrado'}</p>
                                                <p className="text-xs text-slate-400 mt-1">App v{ficha?.app_version || '?'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 border rounded-lg bg-slate-50">
                                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Cronología</p>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                                                    <span className="text-xs text-slate-500">Creado:</span>
                                                    <span className="text-xs font-medium">{ficha?.created_at ? new Date(ficha.created_at).toLocaleString() : '-'}</span>
                                                    <span className="text-xs text-slate-500">Actualizado:</span>
                                                    <span className="text-xs font-medium">{ficha?.updated_at ? new Date(ficha.updated_at).toLocaleString() : '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                         <div className="flex items-start gap-3 p-4 border rounded-lg bg-slate-50 h-full">
                                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div className="w-full">
                                                <p className="text-sm font-medium mb-2">Geolocalización</p>
                                                {ficha?.geo_location ? (
                                                    <div className="bg-white p-2 rounded border font-mono text-xs w-full overflow-hidden">
                                                        <pre className="whitespace-pre-wrap">
                                                            {JSON.stringify(ficha.geo_location, null, 2)}
                                                        </pre>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-500 italic">No hay datos de ubicación</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </form>
        </FormProvider>
    );
}
