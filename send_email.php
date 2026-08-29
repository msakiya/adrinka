<?php
// send_email.php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Use POST.']);
    exit;
}

// Leer datos enviados
$raw_input = file_get_contents('php://input');
$data = json_decode($raw_input, true);

if (!$data) {
    $data = $_POST;
}

$nombre   = isset($data['nombre']) ? trim($data['nombre']) : '';
$telefono = isset($data['telefono']) ? trim($data['telefono']) : '';
$email    = isset($data['email']) ? trim($data['email']) : '';
$servicio = isset($data['servicio']) ? trim($data['servicio']) : '';
$mensaje  = isset($data['mensaje']) ? trim($data['mensaje']) : '';
$page_url = isset($data['page_url']) && !empty($data['page_url']) ? trim($data['page_url']) : ($_SERVER['HTTP_REFERER'] ?? 'Desconocida');

if (empty($nombre) || empty($telefono) || empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Los campos Nombre, Teléfono y Correo Electrónico son obligatorios.']);
    exit;
}

// Configuración de envíos
$to      = 'msakiya14@gmail.com, adinkra9961@gmail.com';
$from    = 'carlos@adinkraperu.com';
$subject = 'Nuevo lead en Servicios';

// Construcción del mensaje según la estructura solicitada
$body  = "Hola, tienes un nuevo lead en tu página:\n\n";
$body .= "DATOS DEL LEAD\n";
$body .= "Nombre: " . $nombre . "\n";
$body .= "Teléfono: " . $telefono . "\n";
$body .= "Correo Electrónico: " . $email . "\n";

if (!empty($servicio)) {
    $body .= "Servicio: " . $servicio . "\n";
}
if (!empty($mensaje)) {
    $body .= "Detalle del Proyecto: " . $mensaje . "\n";
}

$body .= "\nEste lead, viene gracias a: " . $page_url . "\n";

// Encabezados del correo
$headers  = "From: Adinkra Perú <" . $from . ">\r\n";
$headers .= "Reply-To: " . $email . "\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

if (@mail($to, $subject, $body, $headers)) {
    echo json_encode(['success' => true, 'message' => '¡Formulario enviado con éxito!']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al enviar el correo desde el servidor.']);
}
?>
