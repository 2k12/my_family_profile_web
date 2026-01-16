export interface AnalysisResult {
    score: number;
    report: any;
}

export class DataQualityService {
    /**
     * Analyze data against schema (Client-Side).
     * Returns { score: number, report: object }
     */
    static analyze(formSchema: any, responseData: any): AnalysisResult {
        if (!formSchema || !formSchema.sections) {
             // Handle case where schema might be the array of forms or single form object
             if (Array.isArray(formSchema) && formSchema.length > 0 && formSchema[0].sections) {
                 formSchema = formSchema[0];
             } else {
                 return { score: 0, report: { status: 'Invalid Schema' } };
             }
        }

        let totalRequired = 0;
        let filledRequired = 0;
        let totalOptional = 0;
        let filledOptional = 0;
        let fieldReports: any[] = [];

        // Helper
        const isFilled = (value: any) => {
            if (value === null || value === undefined) return false;
            if (typeof value === 'string') return value.trim() !== '';
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'object') return Object.keys(value).length > 0;
            if (typeof value === 'number') return true; // 0 is valid
            return true;
        };

        const sections = formSchema.sections || [];

        // Recursive analysis function
        const analyzeFields = (fields: any[], data: any) => {
            fields.forEach(field => {
                const fieldName = field.name || '';
                // Handle different boolean formats (1/0, true/false)
                const isRequired = field.required === true || field.required === 1 || field.required === '1';
                const type = field.type;
                const dynamicValue = data[fieldName];

                const filled = isFilled(dynamicValue);

                // --- Repeater Logic ---
                if (type === 'range' && field.linked_section_id && filled && typeof dynamicValue === 'number' && dynamicValue > 0) {
                    const linkedId = field.linked_section_id;
                    const childrenKey = `${fieldName}_data`;
                    const childrenData = data[childrenKey];

                    if (Array.isArray(childrenData) && childrenData.length > 0) {
                        // Find template section in the MAIN schema
                        const linkedSection = sections.find((s: any) => s.id == linkedId);

                        if (linkedSection && linkedSection.fields) {
                            childrenData.forEach((childItem: any) => {
                                analyzeFields(linkedSection.fields, childItem);
                            });
                        }
                    }
                }

                // --- Standard Logic ---
                if (isRequired) {
                    totalRequired++;
                    if (filled) filledRequired++;
                } else {
                    totalOptional++;
                    if (filled) filledOptional++;
                }

                if (isRequired && !filled) {
                    fieldReports.push({
                        field: fieldName,
                        issue: 'Missing Required Field',
                        status: 'FAIL'
                    });
                }
            });
        };

        // Start Analysis
        sections.forEach((section: any) => {
            // Skip Template Sections (they are handled recursively by 'range' fields)
            if (section.is_template) {
                return;
            }

            if (section.fields) {
                analyzeFields(section.fields, responseData);
            }
        });

        // --- Scoring ---
        const scoreRequired = (totalRequired > 0) ? (filledRequired / totalRequired) : 1.0;
        const scoreOptional = (totalOptional > 0) ? (filledOptional / totalOptional) : 0.0;

        let finalScore = 0;
        if (totalOptional === 0) {
            finalScore = scoreRequired * 100;
        } else {
            finalScore = (scoreRequired * 70) + (scoreOptional * 30);
        }

        return {
            score: Math.round(finalScore),
            report: {
                total_fields: totalRequired + totalOptional,
                missing_required: totalRequired - filledRequired,
                metrics: {
                    completeness_required: scoreRequired,
                    completeness_optional: scoreOptional,
                },
                details: fieldReports,
            }
        };
    }
}
