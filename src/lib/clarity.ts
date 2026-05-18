import Clarity from '@microsoft/clarity';

const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID;

/**
 * Inicializa Microsoft Clarity si el ID de proyecto está configurado en las variables de entorno.
 */
export const initClarity = () => {
  if (projectId && projectId !== 'yourProjectId') {
    Clarity.init(projectId);
    console.log('[Clarity] Inicializado correctamente con el ID de proyecto configurado.');
  } else {
    console.warn(
      '[Clarity] No se pudo inicializar. Asegúrate de configurar VITE_CLARITY_PROJECT_ID en tu archivo .env.'
    );
  }
};

/**
 * Registra y asocia la sesión de Clarity con los datos del usuario autenticado.
 * @param userId ID del usuario en base de datos.
 * @param name Nombre completo del usuario.
 * @param email Correo electrónico (se utilizará como ID de sesión de cliente).
 * @param role Rol del usuario (ADMIN / USUARIO).
 */
export const identifyUser = (userId: number, name: string, email: string, role: string) => {
  if (projectId && projectId !== 'yourProjectId') {
    // Usamos el ID de usuario como identificador único principal.
    // Pasamos el correo como customSessionId y el rol como friendlyName para facilitar filtrados en el dashboard.
    Clarity.identify(String(userId), email, undefined, `${name} (${role})`);
    console.log(`[Clarity] Identificación enviada para el usuario: ${name} (${role})`);
  }
};
