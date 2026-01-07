import React, { useState } from 'react';
import { toast } from "sonner";
import type { Section, Field } from '@/types';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, GripVertical, Plus } from 'lucide-react';
import { FieldEditorSheet } from './FieldEditorSheet';
import api from '@/lib/api';

interface SectionManagerProps {
  sections: Section[];
  onRefresh: () => void;
  onEditSection: (section: Section) => void;
}

export const SectionManager: React.FC<SectionManagerProps> = ({ sections, onRefresh, onEditSection }) => {
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<number | null>(null);

  const handleEditField = (field: Field) => {
    setEditingField(field);
    setCurrentSectionId(field.section_id || null);
    setIsSheetOpen(true);
  };

  const handleAddField = (sectionId: number) => {
    setEditingField(null);
    setCurrentSectionId(sectionId);
    setIsSheetOpen(true);
  };

  const handleSaveField = async (field: Field) => {
    try {
      if (field.id) {
        await api.put(`/admin/fields/${field.id}`, field);
        toast.success("Campo actualizado");
      } else {
        await api.post(`/admin/sections/${currentSectionId}/fields`, field);
        toast.success("Campo creado");
      }
      onRefresh();
    } catch (error) {
      console.error("Failed to save field", error);
      toast.error("Error al guardar campo");
    }
  };

  const handleDeleteField = async (id: number) => {
    if (!confirm('¿Eliminar campo?')) return;
    try {
      await api.delete(`/admin/fields/${id}`);
      onRefresh();
      toast.success("Campo eliminado");
    } catch (error) {
       console.error("Failed to delete", error);
       toast.error("Error al eliminar campo");
    }
  };

  return (
    <>
      <Accordion type="multiple" className="w-full space-y-4">
        {sections.map((section) => (
          <AccordionItem key={section.id} value={`section-${section.id}`} className="border rounded-lg bg-card px-4">
             <AccordionTrigger className="hover:no-underline">
                 <div className="flex items-center justify-between w-full mr-4">
                    <span className="text-lg font-semibold flex items-center gap-2">
                        {section.name}
                        {section.is_template && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Plantilla</span>}
                    </span>
                    <div className="flex items-center gap-2">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditSection(section);
                            }}
                         >
                            <Edit className="h-4 w-4" />
                         </Button>
                         <span className="text-sm text-muted-foreground mr-auto ml-4">({section.fields.length} campos)</span>
                    </div>
                 </div>
             </AccordionTrigger>
             <AccordionContent className="pt-4 pb-4 space-y-2">
                {section.fields.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No hay campos en esta sección.</p>
                ) : (
                  <div className="space-y-2">
                     {section.fields.map((field) => (
                       <div key={field.id} className="flex items-center gap-3 p-3 rounded-md border bg-background hover:bg-accent/50 transition-colors group">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          <div className="flex-1">
                             <div className="font-medium">{field.label}</div>
                             <div className="text-xs text-muted-foreground font-mono">{field.name} • {field.type} {field.required && '• required'}</div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                             <Button variant="ghost" size="icon" onClick={() => handleEditField(field)}>
                               <Edit className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="icon" onClick={() => field.id && handleDeleteField(field.id)}>
                               <Trash2 className="h-4 w-4 text-destructive" />
                             </Button>
                          </div>
                       </div>
                     ))}
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t flex justify-center">
                   <Button variant="outline" onClick={() => section.id && handleAddField(section.id)}>
                     <Plus className="mr-2 h-4 w-4" /> Agregar Campo
                   </Button>
                </div>
             </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <FieldEditorSheet 
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        field={editingField}
        sectionId={currentSectionId || undefined}
        onSave={handleSaveField}
        allSections={sections}
      />
    </>
  );
};
