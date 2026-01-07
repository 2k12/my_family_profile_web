import type { Field } from "@/types";

export interface FieldOption {
    label: string;
    value: string;
}

export const getComputedOptions = (field: Field, dynamicOptions: any[] = []): FieldOption[] => {
    let options: FieldOption[] = [];

    // 1. Static Options (from database/schema)
    if (Array.isArray(field.options)) {
        options = field.options.map((opt: any) => ({
            label: opt.label || opt.name || 'Sin etiqueta',
            value: String(opt.value !== undefined && opt.value !== null ? opt.value : opt.id).trim()
        }));
    }

    // 2. Dynamic Source (e.g. "range:1-55")
    // Priority: dynamic_source > options string (if it matches pattern)
    let source = field.dynamic_source || (typeof field.options === 'string' ? field.options : null);

    if (source && typeof source === 'string') {
        source = source.trim();
        // Case insensitive check
        if (source.toLowerCase().startsWith('range:')) {
            try {
                // Remove 'range:' and trim
                const rangeBody = source.substring(6).trim(); 
                const rangeParts = rangeBody.split('-');
                
                if (rangeParts.length === 2) {
                    const min = parseInt(rangeParts[0].trim());
                    const max = parseInt(rangeParts[1].trim());

                    if (!isNaN(min) && !isNaN(max)) {
                        const rangeOptions = Array.from({ length: max - min + 1 }, (_, i) => ({
                            label: String(min + i),
                            value: String(min + i)
                        }));
                        options = [...options, ...rangeOptions];
                    }
                }
            } catch (e) {
                console.error("Error parsing range options for field " + field.name, e);
            }
        }
    }

    // 3. API Dynamic Options (Location fields passed from component state)
    if (dynamicOptions && dynamicOptions.length > 0) {
        // If dynamic options are provided (e.g. from API fetch in component), they usually override or append.
        // For location fields, they ARE the options.
        const apiOptions = dynamicOptions.map((opt: any) => ({
            label: opt.label || opt.name,
            value: String(opt.value !== undefined ? opt.value : opt.id)
        }));
        // If we have API options, they usually take precedence for things like Canton/Parroquia
        return apiOptions; 
    }

    return options;
};
