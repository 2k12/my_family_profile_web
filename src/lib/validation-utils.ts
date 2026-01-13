/**
 * Valida una cédula ecuatoriana usando el algoritmo de Módulo 10.
 * @param cedula String con el número de cédula
 * @returns boolean indicando si es válida
 */
export function isValidCedula(cedula: string): boolean {
  // 1. Validar longitud y que sean números
  if (!cedula || cedula.length !== 10 || !/^\d+$/.test(cedula)) {
    return false;
  }

  // 2. Validar código de provincia (01-24) o 30 (Ecuatorianos en el exterior)
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return false;
  }

  // 3. Validar tercer dígito (debe ser menor a 6 para personas naturales)
  const tercerDigito = parseInt(cedula.substring(2, 3), 10);
  if (tercerDigito >= 6) {
    // Nota: Si fuera RUC de personas jurídicas o públicas, este dígito sería 6 o 9.
    // Para cédula de identidad, debe ser < 6 using Modulo 10.
    return false;
  }

  // 4. Algoritmo Módulo 10
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const verificador = parseInt(cedula.substring(9, 10), 10);
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.substring(i, i + 1), 10) * coeficientes[i];
    if (valor >= 10) {
      valor -= 9;
    }
    suma += valor;
  }

  const modulo = suma % 10;
  const resultado = modulo === 0 ? 0 : 10 - modulo;

  return resultado === verificador;
}
