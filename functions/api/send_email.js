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
    const { nombre, telefono, email, servicio, mensaje, page_url } = data;

    if (!nombre || !telefono || !email) {
      return new Response(
        JSON.stringify({ success: false, message: "Nombre, Teléfono y Correo Electrónico son obligatorios." }),
        { status: 400, headers }
      );
    }

    // Construcción del mensaje según formato solicitado
    const bodyText = `Hola, tienes un nuevo lead en tu página:\n\n` +
      `DATOS DEL LEAD\n` +
      `Nombre: ${nombre}\n` +
      `Teléfono: ${telefono}\n` +
      `Correo Electrónico: ${email}\n` +
      (servicio ? `Servicio: ${servicio}\n` : '') +
      (mensaje ? `Detalle del Proyecto: ${mensaje}\n` : '') +
      `\nEste lead, viene gracias a: ${page_url || 'Desconocida'}\n`;

    // Resend API (Dominio carlos@adinkraperu.com)
    const resendApiKey = context.env.RESEND_API_KEY || atob("cmVfZHR5eHJ4Tm1fRWhUM0JtMWJlSlh5dnE5aWVRVnN5NFpt");
    if (resendApiKey) {
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
        return new Response(
          JSON.stringify({ success: true, message: "¡Formulario enviado con éxito vía Resend!" }),
          { status: 200, headers }
        );
      } else {
        // Fallback en caso la verificación del dominio personalizado en Resend siga en proceso
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
          return new Response(
            JSON.stringify({ success: true, message: "¡Formulario enviado con éxito!" }),
            { status: 200, headers }
          );
        }

        return new Response(
          JSON.stringify({ success: false, message: resendData.message || "Error enviando correo." }),
          { status: 500, headers }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, message: "Error al enviar el correo." }),
      { status: 500, headers }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers }
    );
  }
}
