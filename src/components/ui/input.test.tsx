import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './input';

describe('Componente Input', () => {
  it('debería renderizarse correctamente', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('debería aceptar entrada de texto', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text') as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: 'Hola Mundo' } });
    expect(input.value).toBe('Hola Mundo');
  });

  it('debería manejar el atributo type', () => {
    render(<Input type="password" placeholder="Password" />);
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');
  });

  it('debería estar deshabilitado cuando se establece la prop disabled', () => {
     render(<Input disabled placeholder="Disabled" />);
     expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });
});
