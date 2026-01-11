import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Field, FieldOption, Section } from '@/types';

interface FieldEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: Field | null; // null means new field
  onSave: (field: Field) => void;
  sectionId?: number;
  allSections: Section[];
}

export const FieldEditorSheet: React.FC<FieldEditorSheetProps> = ({
  open,
  onOpenChange,
  field,
  onSave,
  sectionId,
  allSections
}) => {
  const { register, handleSubmit, reset, watch, setValue } = useForm<Field>({
    defaultValues: {
      name: '',
      label: '',
      type: 'text',
      required: false,
      options: [],
      dynamic_source: 'static',
      linked_section_id: undefined
    }
  });
  
  // Custom simple field array logic or just state for options
  const [options, setOptions] = React.useState<FieldOption[]>([]);

  const fieldType = watch('type');

  useEffect(() => {
    if (field) {
      reset(field);
      // Ensure options is array
      if (typeof field.options === 'string') {
          // Attempt parse if JSON string or ignore?
          // For now assuming existing options structure is mostly compliant or ignore string content for UI list
          setOptions([]);
      } else {
          setOptions(field.options || []);
      }
    } else {
      reset({
        name: '',
        label: '',
        type: 'text',
        required: false,
        section_id: sectionId,
        order_index: 999
      });
      setOptions([]);
    }
  }, [field, open, sectionId, reset]);

  const onSubmit = (data: Field) => {
    onSave({ ...data, options });
    onOpenChange(false);
  };

  const addOption = () => {
    setOptions([...options, { label: '', value: '' }]);
  };

  const updateOption = (index: number, key: keyof FieldOption, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [key]: value };
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const isOptionType = fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{field ? 'Editar Campo' : 'Nuevo Campo'}</SheetTitle>
          <SheetDescription>
            Configura las propiedades del campo de la encuesta.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="label">Etiqueta (Label)</Label>
            <Input id="label" {...register('label', { required: true })} placeholder="Ej: Nombres completos" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre interno (snake_case)</Label>
            <Input id="name" {...register('name', { required: true })} placeholder="Ej: nombres_completos" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Dato</Label>
            <select
               id="type"
               {...register('type')}
               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="text">Texto</option>
              <option value="number">Número</option>
              <option value="date">Fecha</option>
              <option value="select">Selección (Dropdown)</option>
              <option value="radio">Radio Button</option>
              <option value="checkbox">Checkbox</option>
              <option value="textarea">Área de texto</option>
              <option value="range">Rango / Slider</option>
              <option value="signature">Firma</option>
              <option value="gps">GPS</option>
              <option value="image">Imagen</option>
            </select>
          </div>

          {/* Dynamic Source Configuration */}
          <div className="space-y-4 rounded-md border p-4 bg-muted/10">
              <Label className="font-semibold">Fuente de Datos (Dynamic Source)</Label>
              
              <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                       <input 
                          type="radio" 
                          id="ds_static" 
                          name="ds_type" 
                          checked={!watch('dynamic_source') || watch('dynamic_source') === 'static' || !watch('dynamic_source')?.startsWith('range:')}
                          onChange={() => setValue('dynamic_source', 'static')}
                          className="h-4 w-4"
                       />
                       <Label htmlFor="ds_static" className="font-normal">Estático</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                       <input 
                          type="radio" 
                          id="ds_range" 
                          name="ds_type" 
                          checked={watch('dynamic_source')?.startsWith('range:') || false}
                          onChange={() => setValue('dynamic_source', 'range:0-10')}
                          className="h-4 w-4"
                       />
                       <Label htmlFor="ds_range" className="font-normal">Rango Numérico</Label>
                  </div>
              </div>

               {watch('dynamic_source')?.startsWith('range:') && (
                 <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1">
                        <Label className="text-xs">Mínimo</Label>
                        <Input 
                            type="number"
                            placeholder="0"
                            value={watch('dynamic_source')?.split(':')[1]?.split('-')[0] || '0'}
                            onChange={(e) => {
                                const currentMax = watch('dynamic_source')?.split(':')[1]?.split('-')[1] || '10';
                                setValue('dynamic_source', `range:${e.target.value}-${currentMax}`);
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Máximo</Label>
                        <Input 
                            type="number"
                            placeholder="10"
                            value={watch('dynamic_source')?.split(':')[1]?.split('-')[1] || '10'}
                            onChange={(e) => {
                                const currentMin = watch('dynamic_source')?.split(':')[1]?.split('-')[0] || '0';
                                setValue('dynamic_source', `range:${currentMin}-${e.target.value}`);
                            }}
                        />
                    </div>
                 </div>
               )}
          </div>

          {/* Linked Section */}
          <div className="space-y-2">
            <Label htmlFor="linked_section">Sección Vinculada (Opcional)</Label>
            <select
               id="linked_section"
               {...register('linked_section_id')}
               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <option value="">-- Ninguna --</option>
                {allSections.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Orden: {s.order_index})</option>
                ))}
            </select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Requerido</Label>
              <div className="text-sm text-muted-foreground">
                ¿Es obligatorio responder este campo?
              </div>
            </div>
            <Switch
              checked={watch('required')}
              onCheckedChange={(checked) => setValue('required', checked)}
            />
          </div>

          {isOptionType && (
            <div className="space-y-4 rounded-md border p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label>Opciones</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  + Agregar
                </Button>
              </div>
              
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                       <Input 
                         placeholder="Label" 
                         value={opt.label} 
                         onChange={(e) => updateOption(idx, 'label', e.target.value)}
                         className="h-8"
                       />
                    </div>
                    <div className="flex-1">
                       <Input 
                         placeholder="Value" 
                         value={opt.value} 
                         onChange={(e) => updateOption(idx, 'value', e.target.value)}
                         className="h-8"
                       />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeOption(idx)}>
                      x
                    </Button>
                  </div>
                ))}
                {options.length === 0 && <p className="text-xs text-muted-foreground">No hay opciones definidas.</p>}
              </div>
            </div>
          )}

          <SheetFooter>
            <Button type="submit">Guardar Cambios</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
