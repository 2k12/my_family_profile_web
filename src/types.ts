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
  type: 'text' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'signature' | 'gps';
  required: boolean;
  order_index: number;
  options?: FieldOption[];
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

