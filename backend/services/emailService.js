const nodemailer = require('nodemailer');

// Validar variables de entorno requeridas
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('❌ Variables de entorno de email no configuradas');
  console.error('EMAIL_USER:', !!process.env.EMAIL_USER);
  console.error('EMAIL_PASS:', !!process.env.EMAIL_PASS);
}

// Configuración del transportador de email
// Para desarrollo, usaremos Gmail con autenticación de aplicación
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendPasswordResetEmail = (email, resetCode, username) => {
  // Usar URL de producción si está disponible, sino frontend de Render
  const baseUrl = process.env.FRONTEND_URL || 'https://inventory-frontend-2syh.onrender.com';
  const resetUrl = `${baseUrl}/reset-password?code=${resetCode}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Código de Verificación - Sistema de Inventario',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Código de Verificación</h2>
        <p>Hola <strong>${username}</strong>,</p>
        <p>Has solicitado restablecer tu contraseña en el Sistema de Inventario.</p>
        <p>Tu código de verificación es:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; display: inline-block;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; font-family: monospace; letter-spacing: 4px;">${resetCode}</h1>
          </div>
        </div>
        <p>Ingresa este código en la página de restablecimiento de contraseña:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Ir a Restablecer Contraseña
          </a>
        </div>
        <p><strong>⚠️ Importante:</strong></p>
        <ul>
          <li>Este código expirará en 15 minutos</li>
          <li>No compartas este código con nadie</li>
          <li>Si no solicitaste este cambio, puedes ignorar este correo</li>
        </ul>
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
    from: process.env.EMAIL_USER,
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

const sendEmailVerification = (email, token, username) => {
  // Usar URL de producción si está disponible, sino frontend de Render
  const baseUrl = process.env.FRONTEND_URL || 'https://inventory-frontend-2syh.onrender.com';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verifica tu Email - Sistema de Inventario',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verifica tu Email</h2>
        <p>Hola <strong>${username}</strong>,</p>
        <p>Gracias por registrarte en el Sistema de Inventario. Para completar tu registro, necesitamos verificar que este email te pertenece.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #28a745; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
            ✅ Verificar mi Email
          </a>
        </div>
        <p><strong>¿No funciona el botón?</strong></p>
        <p>Copia y pega este enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #007bff; font-size: 14px;">${verificationUrl}</p>
        <p><strong>⚠️ Importante:</strong></p>
        <ul>
          <li>Este enlace es válido por tiempo indefinido</li>
          <li>No compartas este enlace con nadie</li>
          <li>Si no te registraste en nuestro sistema, puedes ignorar este correo</li>
        </ul>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Este es un correo automático del Sistema de Inventario. Por favor no respondas a este mensaje.
        </p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendPasswordResetEmail,
  sendSeniorAdminPassword,
  sendEmailVerification
}; 