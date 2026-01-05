import { useEffect } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form'; // Added Controller
import { useFormSchema } from '@/hooks/useFormSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

    // Reset form with fetched data
    useEffect(() => {
        if (!isLoading && ficha) {
            const formData = {
                ...(defaultValues || {}),
                ...(ficha.datos || {}), // Merge dynamic data from DB
                nombre_familia: ficha.nombre_familia || '',
                status: ficha.status || 'pending'
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
            const { nombre_familia, status, ...datos } = data;
            await api.put(`/web/fichas/${id}`, { 
                datos: datos,
                nombre_familia: nombre_familia,
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
                 <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Editar Ficha: {ficha?.nombre_familia || id}</h2>
                        <p className="text-muted-foreground">Complete la información requerida.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Controller
                            control={methods.control}
                            name="status"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="w-[180px]">
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
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
                        <Button type="submit">Guardar Cambios</Button>
                    </div>
                </div>

                <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nombre_familia" className="text-right">
                          Nombre Familia
                        </Label>
                        <Input
                          id="nombre_familia"
                          className="col-span-3"
                          {...methods.register("nombre_familia", { required: true })}
                        />
                      </div>
                </div>

                <Tabs defaultValue={schema.sections[0]?.name || ''} className="w-full">
                    <TabsList className="w-full flex-wrap justify-start h-auto gap-2 bg-transparent p-0">
                        {schema.sections.map((section) => (
                            <TabsTrigger 
                                key={section.id} 
                                value={section.name}
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background"
                            >
                                {section.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    
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
                        if (normalizedSectionName.includes('especiales')) finalArrayKey = 'miembros_especiales_data';
                        if (normalizedSectionName.includes('fallecidos')) finalArrayKey = 'miembros_fallecidos_data';

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
                </Tabs>
            </form>
        </FormProvider>
    );
}
