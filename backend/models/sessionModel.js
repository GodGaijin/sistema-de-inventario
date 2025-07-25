const db = require('./database');

// Crear o actualizar sesión activa
const createOrUpdateSession = async (userId, username, refreshToken, ipAddress, userAgent) => {
  try {
    // Primero, eliminar sesiones existentes del mismo usuario
    await db.run(
      'DELETE FROM active_sessions WHERE user_id = $1',
      [userId]
    );

    // Crear nueva sesión
    await db.run(
      'INSERT INTO active_sessions (user_id, username, refresh_token, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [userId, username, refreshToken, ipAddress, userAgent]
    );

  } catch (error) {
    console.error('❌ Error creando/actualizando sesión:', error);
    throw error;
  }
};

// Actualizar actividad de sesión
const updateSessionActivity = async (userId) => {
  try {
    await db.run(
      'UPDATE active_sessions SET last_activity = CURRENT_TIMESTAMP WHERE user_id = $1',
      [userId]
    );
  } catch (error) {
    console.error('❌ Error actualizando actividad de sesión:', error);
    throw error;
  }
};

// Eliminar sesión
const removeSession = async (userId) => {
  try {
    await db.run(
      'DELETE FROM active_sessions WHERE user_id = $1',
      [userId]
    );
  } catch (error) {
    console.error('❌ Error eliminando sesión:', error);
    throw error;
  }
};

// Eliminar sesión por refresh token
const removeSessionByToken = async (refreshToken) => {
  try {
    await db.run(
      'DELETE FROM active_sessions WHERE refresh_token = $1',
      [refreshToken]
    );
  } catch (error) {
    console.error('❌ Error eliminando sesión por token:', error);
    throw error;
  }
};

// Obtener sesión por refresh token
const getSessionByToken = async (refreshToken) => {
  try {
    const session = await db.get(
      'SELECT * FROM active_sessions WHERE refresh_token = $1',
      [refreshToken]
    );
    return session;
  } catch (error) {
    console.error('❌ Error obteniendo sesión por token:', error);
    throw error;
  }
};

// Obtener todas las sesiones activas
const getActiveSessions = async () => {
  try {
    const result = await db.query(
      'SELECT * FROM active_sessions ORDER BY last_activity DESC'
    );
    return result.rows || result;
  } catch (error) {
    console.error('❌ Error obteniendo sesiones activas:', error);
    throw error;
  }
};

// Obtener usuarios únicos activos (sin duplicados por usuario)
const getActiveUsers = async () => {
  try {
    const result = await db.query(`
      SELECT DISTINCT ON (user_id) 
        user_id, 
        username, 
        last_activity, 
        ip_address, 
        user_agent,
        created_at
      FROM active_sessions 
      ORDER BY user_id, last_activity DESC
    `);
    return result.rows || result;
  } catch (error) {
    console.error('❌ Error obteniendo usuarios activos:', error);
    throw error;
  }
};

// Obtener usuarios activos con información de roles
const getActiveUsersWithRoles = async () => {
  try {
    const result = await db.query(`
      SELECT DISTINCT ON (s.user_id) 
        s.user_id, 
        s.username, 
        s.last_activity, 
        s.ip_address, 
        s.user_agent,
        s.created_at,
        COALESCE(u.role, 'user') as role,
        COALESCE(u.email, '') as email
      FROM active_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.user_id, s.last_activity DESC
    `);
    return result.rows || result;
  } catch (error) {
    console.error('❌ Error obteniendo usuarios activos con roles:', error);
    throw error;
  }
};

// Contar usuarios activos
const getActiveUsersCount = async () => {
  try {
    const result = await db.query(
      'SELECT COUNT(DISTINCT user_id) as count FROM active_sessions'
    );
    return (result.rows ? result.rows[0] : result[0]).count;
  } catch (error) {
    console.error('❌ Error contando usuarios activos:', error);
    throw error;
  }
};

// Limpiar sesiones inactivas (más de 1 hora sin actividad)
const cleanupInactiveSessions = async () => {
  try {
    const result = await db.run(
      'DELETE FROM active_sessions WHERE last_activity < NOW() - INTERVAL \'1 hour\''
    );
    return result.changes;
  } catch (error) {
    console.error('❌ Error limpiando sesiones inactivas:', error);
    throw error;
  }
};

// Verificar si un usuario está activo
const isUserActive = async (userId) => {
  try {
    const session = await db.get(
      'SELECT * FROM active_sessions WHERE user_id = $1',
      [userId]
    );
    return !!session;
  } catch (error) {
    console.error('❌ Error verificando si usuario está activo:', error);
    throw error;
  }
};

module.exports = {
  createOrUpdateSession,
  updateSessionActivity,
  removeSession,
  removeSessionByToken,
  getSessionByToken,
  getActiveSessions,
  getActiveUsers,
  getActiveUsersWithRoles,
  getActiveUsersCount,
  cleanupInactiveSessions,
  isUserActive
}; 