const nodemailer = require('nodemailer');

// Configuración del transportador de email
// Para desarrollo, usaremos Gmail con autenticación de aplicación
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'tu-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'tu-contraseña-de-aplicación'
  }
});

const sendPasswordResetEmail = (email, resetToken, username) => {
  // Usar URL de producción si está disponible, sino localhost
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'tu-email@gmail.com',
    to: email,
    subject: 'Recuperación de Contraseña - Sistema de Inventario',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recuperación de Contraseña</h2>
        <p>Hola <strong>${username}</strong>,</p>
        <p>Has solicitado restablecer tu contraseña en el Sistema de Inventario.</p>
        <p>Para continuar con el proceso, haz clic en el siguiente enlace:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Restablecer Contraseña
          </a>
        </div>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        <p>Este enlace expirará en 1 hora por seguridad.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Este es un correo automático, por favor no respondas a este mensaje.
        </p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendSeniorAdminPassword = (email, tempPassword) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'tu-email@gmail.com',
    to: email,
    subject: 'Contraseña Temporal - Administrador Senior',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Acceso Administrador Senior</h2>
        <p>Se ha solicitado acceso al sistema como <strong>Administrador Senior</strong>.</p>
        <div style="background-color: #fff3e0; border: 2px solid #ff9800; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #e65100; margin-top: 0;">Credenciales de Acceso:</h3>
          <p><strong>Usuario:</strong> admin_senior</p>
          <p><strong>Contraseña Temporal:</strong> <span style="font-family: monospace; font-size: 18px; color: #d32f2f; font-weight: bold;">${tempPassword}</span></p>
        </div>
        <p><strong>⚠️ Importante:</strong></p>
        <ul>
          <li>Esta contraseña es temporal y se genera automáticamente</li>
          <li>Úsala solo para acceder al sistema</li>
          <li>Una nueva contraseña se generará en el próximo intento de acceso</li>
          <li>Si no solicitaste este acceso, contacta al administrador del sistema</li>
        </ul>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Este es un correo automático del Sistema de Inventario.
        </p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendPasswordResetEmail,
  sendSeniorAdminPassword
}; 