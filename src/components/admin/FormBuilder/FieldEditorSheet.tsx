import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Field, FieldOption } from '@/types';

interface FieldEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: Field | null; // null means new field
  onSave: (field: Field) => void;
  sectionId?: number;
}

export const FieldEditorSheet: React.FC<FieldEditorSheetProps> = ({
  open,
  onOpenChange,
  field,
  onSave,
  sectionId
}) => {
  const { register, control, handleSubmit, reset, watch, setValue } = useForm<Field>({
    defaultValues: {
      name: '',
      label: '',
      type: 'text',
      required: false,
      options: []
    }
  });
  
  // Custom simple field array logic or just state for options
  const [options, setOptions] = React.useState<FieldOption[]>([]);

  const fieldType = watch('type');

  useEffect(() => {
    if (field) {
      reset(field);
      setOptions(field.options || []);
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
              <option value="signature">Firma</option>
              <option value="gps">GPS</option>
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
