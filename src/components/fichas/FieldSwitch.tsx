import { useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CalendarIcon, ZoomIn, ZoomOut, RotateCcw, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Field } from "@/types";
import { ArrayField } from "./fields/ArrayField";
import { LocationMapWidget } from "./fields/LocationMapWidget";
import api from "@/lib/api";
import { getComputedOptions } from "@/lib/field-utils";

interface FieldSwitchProps {
    field: Field;
    allFields: Field[];
}

export function FieldSwitch({ field, allFields }: FieldSwitchProps) {
    const { register, control, watch, setValue } = useFormContext();
    const [dynamicOptions, setDynamicOptions] = useState<any[]>([]);
    
    // Image Preview State
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 4));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
    const handleResetZoom = () => setZoomLevel(1);
    
    const openPreview = (imgSrc: string) => {
        setPreviewImage(imgSrc);
        setZoomLevel(1);
    };

    // Array Detection
    const isArray = field.name.endsWith('_data');
    const fieldValue = watch(field.name);
    const isArrayContent = Array.isArray(fieldValue);

    // Cascading Logic
    const isLocationField = ['select_provincia', 'select_canton', 'select_parroquia'].includes(field.name);
    
    // Watch parents for cascading
    const provinciaId = watch('select_provincia');
    const cantonId = watch('select_canton');

    useEffect(() => {
        if (!isLocationField) return;

        const fetchOptions = async () => {
             try {
                if (field.name === 'select_provincia') {
                    const res = await api.get('/geo/provinces');
                    setDynamicOptions(res.data);
                } else if (field.name === 'select_canton' && provinciaId) {
                    const res = await api.get(`/geo/cantons/${provinciaId}`);
                    setDynamicOptions(res.data);
                } else if (field.name === 'select_parroquia' && cantonId) {
                    const res = await api.get(`/geo/parishes/${cantonId}`);
                    setDynamicOptions(res.data);
                } else {
                    setDynamicOptions([]);
                }
             } catch (e) {
                 console.error("Error loading options for " + field.name, e);
             }
        };

        fetchOptions();
    }, [isLocationField, field.name, provinciaId, cantonId]);

    // Use dynamic options logic from utility
    const safeOptions = getComputedOptions(field, isLocationField ? dynamicOptions : []);

    // --- RENDERS ---

    // Signature
    if (field.type === 'signature' || field.name === 'firma_responsable') {
        const value = watch(field.name);
        return (
            <div className="space-y-2">
                 <Label>{field.label}</Label>
                 <div className="border rounded-md p-4 flex justify-center bg-gray-50">
                    {value ? (
                        <img 
                            src={`data:image/png;base64,${value}`} 
                            alt="Firma" 
                            className="max-h-40 object-contain cursor-pointer"
                            onClick={() => openPreview(`data:image/png;base64,${value}`)}
                        />
                    ) : (
                        <p className="text-muted-foreground italic">Sin firma registrada</p>
                    )}
                 </div>
                 <input type="hidden" {...register(field.name)} />
                 
                 {previewImage && (
                    <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                        <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0 gap-0 bg-black/95 border-none">
                             <div className="flex justify-between items-center p-2 bg-black/50 text-white z-10 absolute top-0 left-0 right-0">
                                <span className="text-sm font-medium pl-2">Vista Previa</span>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-white hover:bg-white/20 h-8 w-8">
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                                    <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-white hover:bg-white/20 h-8 w-8">
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={handleResetZoom} className="text-white hover:bg-white/20 h-8 w-8">
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setPreviewImage(null)} className="text-white hover:bg-red-500/50 h-8 w-8 ml-2">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                             </div>
                             <div className="flex-1 overflow-auto flex w-full h-full relative p-4 pt-12">
                                <img 
                                    src={previewImage} 
                                    alt="Full Size" 
                                    className={cn("m-auto theme-transition-none", zoomLevel === 1 ? "object-contain w-full h-full" : "flex-shrink-0")}
                                    style={{ 
                                        width: zoomLevel === 1 ? undefined : `${zoomLevel * 100}%`,
                                        height: zoomLevel === 1 ? undefined : 'auto',
                                        maxWidth: zoomLevel === 1 ? '100%' : 'none',
                                        maxHeight: zoomLevel === 1 ? '100%' : 'none',
                                    }} 
                                />
                             </div>
                        </DialogContent>
                    </Dialog>
                 )}
            </div>
        );
    }

    // Location Map
    if (field.type === 'gps' || field.name === 'georreferencia') {
        const value = watch(field.name);
        return <LocationMapWidget value={value} label={field.label} />;
    }

    // Array / Table
    if (isArray || (isArrayContent && !['checkbox', 'select', 'range'].includes(field.type))) {
        return <ArrayField name={field.name} label={field.label} allFields={allFields} />;
    }

    const commonProps = {
        id: field.name,
        placeholder: field.label,
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={field.name}>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
            
            {(() => {
                switch (field.type) {
                    case 'textarea':
                        return <Textarea {...register(field.name, { required: field.required })} {...commonProps} />;
                    
                    case 'range': 
                    case 'select':
                        return (
                            <Controller
                                control={control}
                                name={field.name}
                                rules={{ required: field.required }}
                                render={({ field: { onChange, value } }) => (
                                    <Select 
                                        onValueChange={(val) => {
                                            onChange(val);
                                            if (field.name === 'select_provincia') setValue('select_canton', '');
                                            if (field.name === 'select_canton') setValue('select_parroquia', '');
                                        }} 
                                        value={value ? String(value).trim() : undefined} 
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {safeOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        );

                    case 'radio':
                        return (
                             <Controller
                                control={control}
                                name={field.name}
                                rules={{ required: field.required }}
                                render={({ field: { onChange, value } }) => (
                                    <RadioGroup 
                                        onValueChange={onChange} 
                                        value={value != null ? String(value) : undefined} 
                                        className="flex flex-col space-y-1"
                                    >
                                        {safeOptions.map((opt: any) => (
                                            <div key={opt.value} className="flex items-center space-x-2">
                                                <RadioGroupItem value={String(opt.value)} id={`${field.name}-${opt.value}`} />
                                                <Label htmlFor={`${field.name}-${opt.value}`} className="font-normal">{opt.label}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}
                            />
                        );

                    case 'checkbox':
                        if (safeOptions.length > 0) {
                            return (
                                <Controller
                                    control={control}
                                    name={field.name}
                                    render={({ field: { onChange, value } }) => {
                                        const currentValues = value ? String(value).split(',') : [];
                                        const handleCheck = (checked: boolean, itemValue: string) => {
                                            const strValue = String(itemValue);
                                            let newValues = [...currentValues];
                                            if (checked) {
                                                if (!newValues.includes(strValue)) newValues.push(strValue);
                                            } else {
                                                newValues = newValues.filter(v => v !== strValue);
                                            }
                                            onChange(newValues.join(','));
                                        };
                                        return (
                                            <div className="space-y-2">
                                                {safeOptions.map((opt: any) => (
                                                    <div key={opt.value} className="flex items-center space-x-2">
                                                        <Checkbox 
                                                            id={`${field.name}-${opt.value}`}
                                                            checked={currentValues.includes(String(opt.value))}
                                                            onCheckedChange={(checked) => handleCheck(checked as boolean, String(opt.value))}
                                                        />
                                                        <label htmlFor={`${field.name}-${opt.value}`} className="text-sm font-medium">{opt.label}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }}
                                />
                            );
                        }
                        return (
                             <Controller
                                control={control}
                                name={field.name}
                                render={({ field: { onChange, value } }) => {
                                    const isChecked = value === true || value === "true" || value === "1" || value === "on";
                                    return (
                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={field.name}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => onChange(checked ? "1" : "0")} 
                                            />
                                            <label htmlFor={field.name} className="text-sm font-medium">{field.label}</label>
                                        </div>
                                    )
                                }}
                            />
                        );

                    case 'date':
                        return (
                            <Controller
                                control={control}
                                name={field.name}
                                rules={{ required: field.required }}
                                render={({ field }) => (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(new Date(field.value), "PPP", { locale: es })
                                        ) : (
                                          <span>Seleccionar fecha</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value ? new Date(field.value) : undefined}
                                        onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                        disabled={(date) =>
                                          date > new Date() || date < new Date("1900-01-01")
                                        }
                                        captionLayout="dropdown-buttons"
                                        fromYear={1900}
                                        toYear={new Date().getFullYear()}
                                        locale={es}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                )}
                              />
                        );
                        
                    case 'number':
                         return <Input type="number" {...register(field.name, { required: field.required })} {...commonProps} />;

                    case 'image':
                        return (
                            <Controller
                                control={control}
                                name={field.name}
                                rules={{ required: field.required }}
                                render={({ field: { onChange, value } }) => {
                                    const imageSrc = value && typeof value === 'string' 
                                        ? (value.startsWith('data:') || value.startsWith('http') ? value : `data:image/jpeg;base64,${value}`)
                                        : null;

                                    return (
                                        <div className="space-y-4 rounded-md border p-4 bg-muted/10">
                                            {imageSrc ? (
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="relative group cursor-zoom-in" onClick={() => openPreview(imageSrc)}>
                                                        <img 
                                                            src={imageSrc}
                                                            alt="Vista previa" 
                                                            className="max-h-64 max-w-full rounded-lg border shadow-sm object-contain bg-white transition-transform hover:scale-[1.02]"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                                                            <div className="bg-black/70 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                                                <Eye className="h-3 w-3" /> Clic para ampliar
                                                            </div>
                                                        </div>
                                                        <div className="absolute top-2 right-2">
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full shadow-md"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onChange('');
                                                                }}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="w-full">
                                                         <Label className="text-xs text-muted-foreground mb-1 block">¿Desea cambiar la imagen?</Label>
                                                         <Input
                                                            id={field.name}
                                                            type="file"
                                                            accept="image/*"
                                                            className="cursor-pointer"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        onChange(reader.result as string);
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg bg-white/50">
                                                        <p className="text-sm text-muted-foreground">Sin imagen seleccionada</p>
                                                    </div>
                                                    <Input
                                                        id={field.name}
                                                        type="file"
                                                        accept="image/*"
                                                        className="cursor-pointer"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    onChange(reader.result as string);
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                }}
                            />
                        );

                    default: // text
                        return <Input type="text" {...register(field.name, { required: field.required })} {...commonProps} />;
                }
            })()}

            {/* Global Image Preview Dialog */}
            {previewImage && (
                <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                     <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0 gap-0 bg-black/95 border-none">
                         <div className="flex justify-between items-center p-2 bg-black/50 text-white z-10 absolute top-0 left-0 right-0">
                            <span className="text-sm font-medium pl-2">Vista Previa</span>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-white hover:bg-white/20 h-8 w-8">
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                                <span className="text-xs w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                                <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-white hover:bg-white/20 h-8 w-8">
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleResetZoom} className="text-white hover:bg-white/20 h-8 w-8">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setPreviewImage(null)} className="text-white hover:bg-red-500/50 h-8 w-8 ml-2">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                         </div>
                         <div className="flex-1 overflow-auto flex w-full h-full relative p-4 pt-12">
                            <img 
                                src={previewImage} 
                                alt="Full Size" 
                                className={cn("m-auto outline-none border-none", zoomLevel === 1 ? "object-contain w-full h-full" : "flex-shrink-0")}
                                style={{ 
                                    width: zoomLevel === 1 ? undefined : `${zoomLevel * 100}%`,
                                    height: zoomLevel === 1 ? undefined : 'auto',
                                    maxWidth: zoomLevel === 1 ? '100%' : 'none',
                                    maxHeight: zoomLevel === 1 ? '100%' : 'none',
                                }} 
                            />
                         </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
