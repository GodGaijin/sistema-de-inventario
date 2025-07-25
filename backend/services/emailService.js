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

// Función para enviar email de suspensión de cuenta
const sendAccountSuspensionEmail = async (email, username, reason, durationHours, adminEmail) => {
  try {
    // Mostrar siempre en días, redondeando hacia arriba
    let durationText;
    if (durationHours >= 24) {
      const days = Math.ceil(durationHours / 24);
      durationText = `${days} día${days > 1 ? 's' : ''}`;
    } else {
      durationText = `${durationHours} hora${durationHours > 1 ? 's' : ''}`;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Cuenta Suspendida - Sistema de Inventario',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">⚠️ Cuenta Suspendida</h2>
          <p>Hola <strong>${username}</strong>,</p>
          <p>Tu cuenta en el Sistema de Inventario ha sido suspendida temporalmente por el siguiente motivo:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
            <p><strong>Razón:</strong> ${reason}</p>
            <p><strong>Duración:</strong> ${durationText}</p>
          </div>
          <p>Si consideras que esto es un error o necesitas aclarar la situación, por favor contacta al administrador senior:</p>
          <p><strong>Email del administrador:</strong> ${adminEmail}</p>
          <p>Tu cuenta será reactivada automáticamente una vez que expire el período de suspensión.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Este es un mensaje automático del Sistema de Inventario. No respondas a este email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    // Email de suspensión enviado exitosamente
  } catch (error) {
    console.error('❌ Error enviando email de suspensión:', error);
    throw error;
  }
};

// Función para enviar email de levantamiento de suspensión
const sendAccountUnsuspensionEmail = async (email, username) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Cuenta Reactivada - Sistema de Inventario',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #388e3c;">✅ Cuenta Reactivada</h2>
          <p>Hola <strong>${username}</strong>,</p>
          <p>Tu cuenta en el Sistema de Inventario ha sido reactivada exitosamente.</p>
          <p>Ya puedes acceder nuevamente al sistema con tus credenciales habituales.</p>
          <div style="background-color: #f1f8e9; padding: 15px; border-left: 4px solid #388e3c; margin: 20px 0;">
            <p><strong>Estado:</strong> Cuenta activa</p>
            <p><strong>Fecha de reactivación:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>
          <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al administrador del sistema.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Este es un mensaje automático del Sistema de Inventario. No respondas a este email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    // Email de reactivación enviado exitosamente
  } catch (error) {
    console.error('❌ Error enviando email de reactivación:', error);
    throw error;
  }
};

// Función para enviar email de alerta de seguridad
const sendSecurityAlertEmail = async (email, username, alertType, details) => {
  try {
    let subject, content;
    
    switch (alertType) {
      case 'suspicious_login':
        subject = 'Alerta de Seguridad - Inicio de Sesión Sospechoso';
        content = `
          <h2 style="color: #ff9800;">🚨 Alerta de Seguridad</h2>
          <p>Hola <strong>${username}</strong>,</p>
          <p>Se ha detectado un inicio de sesión sospechoso en tu cuenta:</p>
          <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <p><strong>IP:</strong> ${details.ip}</p>
            <p><strong>Ubicación:</strong> ${details.location || 'Desconocida'}</p>
            <p><strong>Dispositivo:</strong> ${details.device || 'Desconocido'}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>
          <p>Si no fuiste tú, te recomendamos cambiar tu contraseña inmediatamente.</p>
        `;
        break;
      
      case 'multiple_failed_attempts':
        subject = 'Alerta de Seguridad - Múltiples Intentos Fallidos';
        content = `
          <h2 style="color: #f44336;">🔒 Alerta de Seguridad</h2>
          <p>Hola <strong>${username}</strong>,</p>
          <p>Se han detectado múltiples intentos fallidos de inicio de sesión en tu cuenta:</p>
          <div style="background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0;">
            <p><strong>Intentos fallidos:</strong> ${details.attempts}</p>
            <p><strong>IP:</strong> ${details.ip}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>
          <p>Tu cuenta ha sido bloqueada temporalmente por seguridad.</p>
        `;
        break;
      
      default:
        subject = 'Alerta de Seguridad - Sistema de Inventario';
        content = `
          <h2 style="color: #ff9800;">⚠️ Alerta de Seguridad</h2>
          <p>Hola <strong>${username}</strong>,</p>
          <p>Se ha detectado actividad sospechosa en tu cuenta:</p>
          <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <p><strong>Detalles:</strong> ${details.message || 'Actividad sospechosa detectada'}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>
        `;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${content}
          <p>Si tienes alguna pregunta, contacta al administrador del sistema.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Este es un mensaje automático del Sistema de Inventario. No respondas a este email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    // Email de alerta de seguridad enviado exitosamente
  } catch (error) {
    console.error('❌ Error enviando email de alerta de seguridad:', error);
    throw error;
  }
};

const sendAccountBanEmail = async (email, username, reason, adminEmail) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Cuenta Baneada Permanentemente - Sistema de Inventario',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">🚫 Cuenta Baneada Permanentemente</h2>
          <p>Hola <strong>${username}</strong>,</p>
          <p>Tu cuenta en el Sistema de Inventario ha sido <strong>baneada permanentemente</strong> por el siguiente motivo:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
            <p><strong>Razón:</strong> ${reason}</p>
          </div>
          <p>Si consideras que esto es un error o necesitas aclarar la situación, por favor contacta al administrador senior:</p>
          <p><strong>Email del administrador:</strong> ${adminEmail}</p>
          <p>Tu cuenta permanecerá inactiva hasta que un administrador senior decida reactivarla.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Este es un mensaje automático del Sistema de Inventario. No respondas a este email.
          </p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Error enviando email de baneo:', error);
    throw error;
  }
};

const sendAccountUnbanEmail = async (email, username, adminEmail) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Cuenta Reactivada - Sistema de Inventario',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #388e3c;">✅ Cuenta Reactivada</h2>
          <p>Hola <strong>${username}</strong>,</p>
          <p>Tu cuenta en el Sistema de Inventario ha sido <strong>reactivada</strong> por un administrador senior.</p>
          <p>Ya puedes acceder nuevamente al sistema con tus credenciales habituales.</p>
          <p>Si tienes alguna pregunta o necesitas ayuda, contacta al administrador senior:</p>
          <p><strong>Email del administrador:</strong> ${adminEmail}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Este es un mensaje automático del Sistema de Inventario. No respondas a este email.
          </p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Error enviando email de desbaneo:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendSeniorAdminPassword,
  sendEmailVerification,
  sendAccountSuspensionEmail,
  sendAccountUnsuspensionEmail,
  sendSecurityAlertEmail,
  sendAccountBanEmail,
  sendAccountUnbanEmail,
}; 