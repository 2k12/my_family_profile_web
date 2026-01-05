import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { FormStructure, Ficha } from '@/types';
import { toast } from 'sonner';

interface UseFormSchemaReturn {
    isLoading: boolean;
    schema: FormStructure | null;
    defaultValues: Record<string, any>;
    ficha: Ficha | null;
}

export const useFormSchema = (formId: number | string, fichaId: number | string): UseFormSchemaReturn => {
    const [isLoading, setIsLoading] = useState(true);
    const [schema, setSchema] = useState<FormStructure | null>(null);
    const [defaultValues, setDefaultValues] = useState<Record<string, any>>({});
    const [ficha, setFicha] = useState<Ficha | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [structureRes, fichaRes] = await Promise.all([
                    api.get(`/admin/forms/${formId}/full`),
                    api.get(`/web/fichas/${fichaId}`)
                ]);

                setSchema(structureRes.data);
                setFicha(fichaRes.data);
                
                // The 'datos' field contains the actual form values
                setDefaultValues(fichaRes.data.datos || {});

            } catch (error) {
                console.error('Error fetching form data:', error);
                toast.error('Error al cargar la ficha');
            } finally {
                setIsLoading(false);
            }
        };

        if (formId && fichaId) {
            fetchData();
        }
    }, [formId, fichaId]);

    return { isLoading, schema, defaultValues, ficha };
};
