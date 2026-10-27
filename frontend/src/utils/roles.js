/** true si el usuario del store de auth es administrador. */
export const esRolAdmin = (user) => (user?.rol_codigo ?? user?.rol ?? '') === 'ADMIN';
