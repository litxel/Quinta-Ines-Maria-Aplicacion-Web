'use strict';
/**
 * Prueba el envío de correos con la configuración actual del .env y explica
 * el error si falla. Sirve tanto en local (SMTP/Gmail) como para Brevo.
 *
 * Uso (desde la carpeta backend):
 *   node scripts/probar-correo.js tu-correo@gmail.com
 */
require('dotenv').config({ quiet: true, path: require('path').join(__dirname, '../.env') });
const email = require('../src/utils/email.service');

const destino = process.argv[2];
if (!destino || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destino)) {
  console.log('\nUso: node scripts/probar-correo.js tu-correo@ejemplo.com\n');
  process.exit(1);
}

const modo = process.env.BREVO_API_KEY ? 'Brevo (API HTTP)' : process.env.SMTP_HOST ? `SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT ?? 587})` : 'NINGUNO';
const remitente = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || '(sin remitente)';

console.log('\n📧 Prueba de correo — EventPlanner QIM');
console.log(`   Modo de envío : ${modo}`);
console.log(`   Remitente     : ${remitente}`);
console.log(`   Destino       : ${destino}\n`);

email.enviarCorreo({
  para:   destino,
  asunto: 'Prueba de correo — Quinta Inés María',
  html:   '<p>Si lees esto, el envío de correos de <strong>EventPlanner QIM</strong> funciona correctamente. ✅</p>',
})
  .then(() => {
    console.log('✅ Correo enviado. Revisa la bandeja de entrada (y la carpeta de spam).\n');
  })
  .catch((err) => {
    console.log('❌ No se pudo enviar el correo.');
    console.log(`   Causa probable: ${email.describirErrorCorreo(err)}`);
    console.log(`   Detalle técnico: ${err.code ?? ''} ${String(err.message).slice(0, 300)}\n`);
    process.exitCode = 1;
  });
