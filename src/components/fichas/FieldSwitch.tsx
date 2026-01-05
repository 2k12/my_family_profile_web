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
import { CalendarIcon } from "lucide-react";
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

    // Array Detection
    const isArray = field.name.endsWith('_data');
    const fieldValue = watch(field.name);
    const isArrayContent = Array.isArray(fieldValue);

    // Cascading Logic
    const isLocationField = ['select_provincia', 'select_canton', 'select_parroquia'].includes(field.name);
    
    // Watch parents for cascading
    const provinciaId = watch('select_provincia');
    // ... rest of logic ... 

   // --- RENDERS ---
   // (Skipping unchanging parts, I will target the Return block or re-write the whole function header/interface)
   // This tool replace_file needs CONTINUOUS blocks.
   // I will replacing the top part including interface.
   // AND the ArrayField call part. 
   // So I might need 2 chunks OR replace a large block.
   
   // Chunk 1: Interface and signature
   // Chunk 2: ArrayField render

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
                } else if (field.name === 'grupo_cultural') {
                    // Assuming endpoint exists or it uses dynamic_source if provided? 
                    // If backend provides a specific endpoint for this:
                    // const res = await api.get('/catalogs/grupo-cultural'); 
                    // But if it's just from dynamic_source (e.g. "manual options"), getSafeOptions handles it.
                    // If user says "no carga", maybe it needs an API call?
                    // Let's assume it IS an API call if it's in this list. Checking API routes?
                    // I will check api.php later. for now, I will treat it as "provincia" (load from somewhere).
                    // Actually, if it's "select" and has no options, it might be waiting for this.
                    // Let's look at types/Field.
                    // For now, I'll remove the destructive useEffect first.
                    setDynamicOptions([]); 
                } else {
                    setDynamicOptions([]);
                }
             } catch (e) {
                 console.error("Error loading options for " + field.name, e);
             }
        };

        fetchOptions();
    }, [isLocationField, field.name, provinciaId, cantonId]);

    // Clearing values on parent change is now handled in the onChange prop of the parent Select
    // to avoid clearing values on initial load/remount.

    // Let's rely on User manually changing it for now to avoid wiping DB data on edit load.
    // OR: Check if `fieldValue` exists in `dynamicOptions` after fetch? 
    
    // Use dynamic options logic from utility
    const safeOptions = getComputedOptions(field, isLocationField ? dynamicOptions : []);

    if (field.name === 'numero_ficha_familiar') {
        console.log('DEBUG COMPONENT', { 
            name: field.name,
            firstOption: safeOptions[0], // Check structure: {label: "1", value: "1"}
            optionsCount: safeOptions.length,
            currentValue: watch(field.name)
        });
    }


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
                            className="max-h-40 object-contain"
                        />
                    ) : (
                        <p className="text-muted-foreground italic">Sin firma registrada</p>
                    )}
                 </div>
                 <input type="hidden" {...register(field.name)} />
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
                    
                    case 'range': // Render Range as Select
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
                                            // Manual trigger for cascading clear could go here if we extracted this Select
                                            if (field.name === 'select_provincia') setValue('select_canton', '');
                                            if (field.name === 'select_canton') setValue('select_parroquia', '');
                                        }} 
                                        value={value ? String(value) : undefined} 
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
                        // If field has options, it's a multi-select checkbox group
                        // But wait, safeOptions is computed. Use that.
                        if (safeOptions.length > 0) {
                            return (
                                <Controller
                                    control={control}
                                    name={field.name}
                                    render={({ field: { onChange, value } }) => {
                                        // "1,2,3" -> ["1", "2", "3"]
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
                        
                        // Single Boolean Checkbox (no options)
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
                        // Shadcn DatePicker // ... (Existing logic below remains same if not replaced? Wait, tool replaces inclusive)
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
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                )}
                              />
                        );
                        
                    case 'number':
                         return <Input type="number" {...register(field.name, { required: field.required })} {...commonProps} />;

                    default: // text
                        return <Input type="text" {...register(field.name, { required: field.required })} {...commonProps} />;
                }
            })()}
        </div>
    );
}
