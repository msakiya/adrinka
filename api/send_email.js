// api/send_email.js
// Vercel Serverless Function (Ejecuta 100% GRATIS en Vercel)

export default async function handler(req, res) {
  // Configurar encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido. Use POST.' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { nombre, telefono, email, servicio, mensaje, page_url } = data || {};

    if (!nombre || !telefono || !email) {
      return res.status(400).json({ success: false, message: 'Nombre, Teléfono y Correo Electrónico son obligatorios.' });
    }

    const bodyText = `Hola, tienes un nuevo lead en tu página:\n\n` +
      `DATOS DEL LEAD\n` +
      `Nombre: ${nombre}\n` +
      `Teléfono: ${telefono}\n` +
      `Correo Electrónico: ${email}\n` +
      (servicio ? `Servicio: ${servicio}\n` : '') +
      (mensaje ? `Detalle del Proyecto: ${mensaje}\n` : '') +
      `\nEste lead, viene gracias a: ${page_url || 'Desconocida'}\n`;

    const resendApiKey = process.env.RESEND_API_KEY || Buffer.from("cmVfZHR5eHJ4Tm1fRWhUM0JtMWJlSlh5dnE5aWVRVnN5NFpt", "base64").toString("utf-8");

    // 1. Envío vía Resend API con remitente carlos@adinkraperu.com
    let resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Adinkra Perú <carlos@adinkraperu.com>",
        to: ["msakiya14@gmail.com", "adinkra9961@gmail.com"],
        subject: "Nuevo lead en Servicios",
        text: bodyText,
      }),
    });

    let resendData = await resendRes.json().catch(() => ({}));

    if (resendRes.ok) {
      return res.status(200).json({ success: true, message: "¡Formulario enviado con éxito!" });
    } else {
      // Reintento con remitente por defecto de Resend si el dominio aún no está verificado en Resend
      const fallbackRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Adinkra Leads <onboarding@resend.dev>",
          to: ["msakiya14@gmail.com", "adinkra9961@gmail.com"],
          subject: "Nuevo lead en Servicios",
          text: bodyText,
        }),
      });

      if (fallbackRes.ok) {
        return res.status(200).json({ success: true, message: "¡Formulario enviado con éxito!" });
      }

      return res.status(500).json({ success: false, message: resendData.message || "Error al enviar el correo." });
    }

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
