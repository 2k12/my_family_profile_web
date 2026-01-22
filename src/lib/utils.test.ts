import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('Utilidades (utils)', () => {
  describe('función cn', () => {
    it('debería fusionar nombres de clases correctamente', () => {
      const result = cn('c-1', 'c-2');
      expect(result).toBe('c-1 c-2');
    });

    it('debería manejar clases condicionales', () => {
      const result = cn('c-1', true && 'c-2', false && 'c-3');
      expect(result).toBe('c-1 c-2');
    });

    it('debería manejar entradas undefined y null', () => {
        const result = cn('c-1', undefined, null, 'c-2');
        expect(result).toBe('c-1 c-2');
    });

    it('debería fusionar clases de tailwind correctamente usando tailwind-merge', () => {
        // px-2 es sobreescrito por px-4
        const result = cn('px-2 py-1', 'px-4');
        expect(result).toBe('py-1 px-4');
    });
  });
});
