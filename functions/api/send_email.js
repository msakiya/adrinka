// functions/api/send_email.js
// Cloudflare Pages Function (Ejecuta 100% gratis en Cloudflare)

export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestPost(context) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const data = await context.request.json();
    const { nombre, telefono, whatsapp, email, servicio, mensaje, page_url } = data;

    if (!nombre || !telefono || !whatsapp) {
      return new Response(
        JSON.stringify({ success: false, message: "Nombre, Teléfono y WhatsApp son obligatorios." }),
        { status: 400, headers }
      );
    }

    // Construcción del mensaje
    const bodyText = `Hola, tienes un nuevo lead en tu página:\n\n` +
      `DATOS DEL LEAD\n` +
      `Nombre: ${nombre}\n` +
      `Teléfono: ${telefono}\n` +
      `WhatsApp: ${whatsapp}\n` +
      (email ? `Email: ${email}\n` : '') +
      (servicio ? `Servicio: ${servicio}\n` : '') +
      (mensaje ? `Mensaje: ${mensaje}\n` : '') +
      `\nEste lead, viene gracias a: ${page_url || 'Desconocida'}\n`;

    // 1. Resend API (Dominio carlos@adinkraperu.com)
    const resendApiKey = context.env.RESEND_API_KEY || atob("cmVfZHR5eHJ4Tm1fRWhUM0JtMWJlSlh5dnE5aWVRVnN5NFpt");
    if (resendApiKey) {
      let resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Adrinka Perú <carlos@adinkraperu.com>",
          to: ["msakiya14@gmail.com", "adinkra9961@gmail.com"],
          subject: "Nuevo lead en Servicios",
          text: bodyText,
        }),
      });

      let resendData = await resendRes.json().catch(() => ({}));

      if (resendRes.ok) {
        return new Response(
          JSON.stringify({ success: true, message: "¡Formulario enviado con éxito vía Resend!" }),
          { status: 200, headers }
        );
      } else {
        // Fallback en caso la verificación del dominio personalizado en Resend siga en proceso
        if (resendData.message && (resendData.message.includes("domain") || resendData.message.includes("verify"))) {
          const fallbackRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Adrinka Leads <onboarding@resend.dev>",
              to: ["msakiya14@gmail.com", "adinkra9961@gmail.com"],
              subject: "Nuevo lead en Servicios",
              text: bodyText,
            }),
          });
          if (fallbackRes.ok) {
            return new Response(
              JSON.stringify({ success: true, message: "¡Formulario enviado con éxito!" }),
              { status: 200, headers }
            );
          }
        }

        return new Response(
          JSON.stringify({ success: false, message: resendData.message || "Error enviando vía Resend." }),
          { status: 500, headers }
        );
      }
    }

    // 2. Si se configuró una Access Key de Web3Forms (Gratis y sin servidor)
    const web3Key = context.env.WEB3FORMS_ACCESS_KEY || "YOUR_WEB3FORMS_KEY";
    if (web3Key && web3Key !== "YOUR_WEB3FORMS_KEY") {
      const web3Res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: web3Key,
          subject: "Nuevo lead en Servicios",
          from_name: "carlos@adinkraperu.com",
          message: bodyText,
          to_email: "msakiya14@gmail.com, adinkra9961@gmail.com"
        }),
      });

      if (web3Res.ok) {
        return new Response(
          JSON.stringify({ success: true, message: "¡Formulario enviado con éxito!" }),
          { status: 200, headers }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: "Configura RESEND_API_KEY o WEB3FORMS_ACCESS_KEY en las variables de entorno de Cloudflare Pages."
      }),
      { status: 500, headers }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers }
    );
  }
}
