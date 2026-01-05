export interface FieldOption {
  id?: number;
  label: string;
  value: string;
  order_index?: number;
}

export interface Field {
  id?: number;
  section_id?: number;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'signature' | 'gps' | 'range';
  required: boolean;
  order_index: number;
  options?: FieldOption[] | string;
  dynamic_source?: string;
}

export interface Section {
  id?: number;
  form_id?: number;
  name: string;
  order_index: number;
  fields: Field[];
}

export interface FormStructure {
  id: number;
  name: string;
  description?: string;
  sections: Section[];
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'USUARIO';
    is_active?: boolean;
}


export interface Ficha {
    id: number;
    user_id: number;
    local_id?: string;
    nombre_familia?: string;
    datos: Record<string, any>;
    status: 'BORRADOR' | 'COMPLETO' | 'PENDIENTE' | 'verified' | 'pending' | 'rejected';
    created_at: string;
    updated_at: string;
}
