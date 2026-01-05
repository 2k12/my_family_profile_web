import { useState } from "react";
import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChipSelect } from "./ChipSelect";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { Field } from "@/types";

interface ArrayFieldProps {
  name: string;
  label: string;
  allFields: Field[];
  renderMode?: 'table' | 'cards';
}

export function ArrayField({ name, label, allFields, renderMode = 'table' }: ArrayFieldProps) {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [showAddConfirm, setShowAddConfirm] = useState(false);

  // Infer columns from the first item or defaults
  const getColumns = () => {
    if (fields.length > 0) {
        // Exclude internal id from useFieldArray
        const sample = fields[0] as Record<string, any>;
        return Object.keys(sample).filter(k => k !== 'id');
    }
    // Fallbacks based on known arrays in project context
    if (name.includes('miembros_generales')) return ['cedula', 'nombres', 'apellidos', 'sexo', 'fecha_nacimiento', 'parentesco', 'grupo_edad', 'ocupacion', 'escolaridad', 'salud_bucal', 'esquema_vacunas', 'predis_enfermedad_discapacidad', 'histoira_clinica', 'familiar_general_x'];
    if (name.includes('miembros_fallecidos')) return ['nombres', 'edad', 'cause', 'fecha_fallecimiento'];
    if (name.includes('problemas_ambientales')) return ['tipo_contaminacion', 'causa', 'frecuencia'];
    
    return ['valor']; // Fallback
  };

  const columns = getColumns();

  const renderCellInput = (index: number, col: string) => {
      const fieldName = `${name}.${index}.${col}`;
      
      const fieldDef = allFields.find(f => f.name === col);

      const getSafeOptions = (f: Field) => {
          // Check dynamic_source first if it might contain range info
          const source = f.dynamic_source || f.options;

          if (Array.isArray(f.options)) return f.options;
          
          if (typeof source === 'string' && source.startsWith('range:')) {
            try {
                const rangeParts = source.replace('range:', '').split('-');
                if (rangeParts.length === 2) {
                    const min = parseInt(rangeParts[0].trim());
                    const max = parseInt(rangeParts[1].trim());
                    if (!isNaN(min) && !isNaN(max)) {
                        return Array.from({ length: max - min + 1 }, (_, i) => ({
                            label: String(min + i),
                            value: String(min + i)
                        }));
                    }
                }
            } catch (e) { console.error(e) }
          }
          return [];
      };
      const safeOptions = fieldDef ? getSafeOptions(fieldDef) : [];

      // 1. SELECT (if defined in schema)
      // Added range type check here implicitly via safeOptions or explicit check
      if (fieldDef?.type === 'select' || fieldDef?.type === 'radio' || (fieldDef?.type === 'range' || (typeof fieldDef?.options === 'string' && fieldDef?.options.startsWith('range:')))) {
          return (
             <Controller
                control={control}
                name={fieldName}
                render={({ field: { onChange, value } }) => (
                     <select 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={value != null ? String(value) : ''}
                        onChange={(e) => onChange(e.target.value)}
                    >
                        <option value="" disabled>Seleccione...</option>
                        {safeOptions.map((opt: any) => {
                             const itemValue = String(opt.value !== undefined ? opt.value : opt.id);
                             return (
                                <option key={itemValue} value={itemValue}>
                                   {opt.label || opt.name}
                                </option>
                             );
                        })}
                    </select>
                )}
             />
          );
      }

      // 2. DATE (by name convention or type)
      if (col.includes('fecha') || fieldDef?.type === 'date') {
          return (
             <Controller
                control={control}
                name={fieldName}
                render={({ field }) => {
                   // Robust Date Parsing for YYYY-MM-DD to Local Date
                   const dateValue = field.value ? (() => {
                       if (typeof field.value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(field.value)) {
                            const [y, m, d] = field.value.split('-').map(Number);
                            return new Date(y, m - 1, d);
                       }
                       return new Date(field.value);
                   })() : undefined;

                   return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {dateValue ? (
                          format(dateValue, "P", { locale: es })
                        ) : (
                          <span>Seleccionar</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateValue}
                        onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}}
              />
          );
      }

      // 3. MULTI-SELECT (Chips)
      if (fieldDef?.type === 'checkbox' && safeOptions.length > 0) {
          return (
             <Controller
                control={control}
                name={fieldName}
                render={({ field }) => (
                    <ChipSelect 
                        value={field.value != null ? String(field.value) : ''} 
                        onChange={field.onChange} 
                        options={safeOptions as any[]} 
                    />
                )}
             />
          );
      }

      // 4. Default Text
      return <Input {...register(fieldName)} />;
  };

  const handleAddItem = () => {
    setShowAddConfirm(true);
  };

  const confirmAddItem = () => {
    const newItem = columns.reduce((acc, col) => ({ ...acc, [col]: '' }), {});
    append(newItem);
    setShowAddConfirm(false);
  };

  const handleDeleteItem = (index: number) => {
      setDeleteIndex(index);
  };

  const confirmDelete = () => {
      if (deleteIndex !== null) {
          remove(deleteIndex);
          setDeleteIndex(null);
      }
  };

  if (renderMode === 'cards') {
      return (
        <div className="space-y-4 rounded-md p-4 bg-slate-50 border">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-gray-700 uppercase">{label}</h4>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus className="mr-2 h-4 w-4" /> Agregar {label}
                </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                {fields.map((field, index) => (
                    <Card key={field.id} className="relative p-4">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteItem(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                            {columns.map((col) => {
                                const fieldDef = allFields.find(f => f.name === col);
                                const labelText = fieldDef?.label || col.replace(/_/g, ' ');
                                return (
                                    <div key={`${field.id}-${col}`} className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                                            {labelText}
                                        </label>
                                        {renderCellInput(index, col)}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                ))}
            </div>

            {fields.length === 0 && (
                 <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    No hay registros. Agregue uno nuevo.
                 </div>
            )}

            {/* Modals */}
             <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el registro permanentemente de la vista actual.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showAddConfirm} onOpenChange={setShowAddConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Agregar Nuevo Registro</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Desea agregar un nuevo {label}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmAddItem}>Agregar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      );
  }

  // DEFAULT TABLE LAYOUT
  return (
    <div className="space-y-4 border rounded-md p-4 bg-slate-50">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-gray-700 uppercase">{label.replace('_data', '').replace(/_/g, ' ')}</h4>
        <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleAddItem}
        >
          <Plus className="mr-2 h-4 w-4" /> Agregar Item
        </Button>
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col} className="capitalize min-w-[150px]">{col.replace(/_/g, ' ')}</TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                {columns.map((col) => (
                  <TableCell key={`${field.id}-${col}`}>
                    {renderCellInput(index, col)}
                  </TableCell>
                ))}
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteItem(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {fields.length === 0 && (
                <TableRow>
                    <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground h-24">
                        No hay registros. Agregue uno nuevo.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       {/* Modals for Table View */}
       <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción eliminará el registro seleccionado.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showAddConfirm} onOpenChange={setShowAddConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Agregar Nuevo Registro</AlertDialogTitle>
                    <AlertDialogDescription>
                        ¿Desea agregar un nuevo registro a la tabla?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmAddItem}>Agregar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
