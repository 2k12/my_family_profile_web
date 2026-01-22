import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';

describe('Componente Card', () => {
  it('debería renderizar la estructura de la tarjeta correctamente', () => {
    render(
      <Card>
        <CardHeader>
            <CardTitle>Título de Tarjeta</CardTitle>
        </CardHeader>
        <CardContent>
            <p>Contenido de Tarjeta</p>
        </CardContent>
        <CardFooter>
            <button>Acción Footer</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Título de Tarjeta')).toBeInTheDocument();
    expect(screen.getByText('Contenido de Tarjeta')).toBeInTheDocument();
    expect(screen.getByText('Acción Footer')).toBeInTheDocument();
  });
});
