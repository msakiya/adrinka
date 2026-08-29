<?php
// send_email.php
// Script de envío para hosting compartido con autenticación SMTP directa

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

// Leer datos del POST
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

// Credenciales SMTP del Hosting Compartido
$smtp_host = 'smtp.adinkraperu.com';
$smtp_port = 465; // SSL
$smtp_user = 'carlos@adinkraperu.com';
$smtp_pass = 'Mz636f8f4';

$recipients = ['msakiya14@gmail.com', 'adinkra9961@gmail.com'];
$subject    = 'Nuevo lead en Servicios';

// Construcción del mensaje según formato solicitado
$bodyText  = "Hola, tienes un nuevo lead en tu página:\n\n";
$bodyText .= "DATOS DEL LEAD\n";
$bodyText .= "Nombre: " . $nombre . "\n";
$bodyText .= "Teléfono: " . $telefono . "\n";
$bodyText .= "Correo Electrónico: " . $email . "\n";

if (!empty($servicio)) {
    $bodyText .= "Servicio: " . $servicio . "\n";
}
if (!empty($mensaje)) {
    $bodyText .= "Detalle del Proyecto: " . $mensaje . "\n";
}

$bodyText .= "\nEste lead, viene gracias a: " . $page_url . "\n";

/**
 * Función auxiliar para enviar correo vía SMTP autenticado SSL/TLS mediante socket
 */
function send_smtp_email($host, $port, $username, $password, $from_email, $from_name, $to_emails, $subject, $body) {
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);

    $socket = @stream_socket_client("ssl://{$host}:{$port}", $errno, $errstr, 12, STREAM_CLIENT_CONNECT, $context);
    if (!$socket) {
        // Probar puerto 587 si 465 no conecta
        $socket = @stream_socket_client("tcp://{$host}:587", $errno, $errstr, 12, STREAM_CLIENT_CONNECT, $context);
        if (!$socket) {
            return false;
        }
    }

    fgets($socket, 512);

    fputs($socket, "EHLO " . gethostname() . "\r\n");
    while ($line = fgets($socket, 512)) {
        if (substr($line, 3, 1) == ' ') break;
    }

    fputs($socket, "AUTH LOGIN\r\n");
    fgets($socket, 512);

    fputs($socket, base64_encode($username) . "\r\n");
    fgets($socket, 512);

    fputs($socket, base64_encode($password) . "\r\n");
    $auth_res = fgets($socket, 512);
    if (substr($auth_res, 0, 3) != '235') {
        fclose($socket);
        return false;
    }

    fputs($socket, "MAIL FROM: <{$from_email}>\r\n");
    fgets($socket, 512);

    foreach ($to_emails as $to) {
        fputs($socket, "RCPT TO: <{$to}>\r\n");
        fgets($socket, 512);
    }

    fputs($socket, "DATA\r\n");
    fgets($socket, 512);

    $headers  = "From: {$from_name} <{$from_email}>\r\n";
    $headers .= "To: " . implode(', ', $to_emails) . "\r\n";
    $headers .= "Subject: {$subject}\r\n";
    $headers .= "Date: " . date('r') . "\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "MIME-Version: 1.0\r\n";

    fputs($socket, $headers . "\r\n" . $body . "\r\n.\r\n");
    $data_res = fgets($socket, 512);

    fputs($socket, "QUIT\r\n");
    fclose($socket);

    return substr($data_res, 0, 3) == '250';
}

// Intentar envío vía SMTP
$success = send_smtp_email($smtp_host, $smtp_port, $smtp_user, $smtp_pass, $smtp_user, "Adinkra Perú", $recipients, $subject, $bodyText);

// Fallback nativo mail() de PHP si el puerto SMTP socket requiere entorno local del servidor
if (!$success) {
    $to_str = implode(', ', $recipients);
    $headers  = "From: Adinkra Perú <{$smtp_user}>\r\n";
    $headers .= "Reply-To: {$email}\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $success = @mail($to_str, $subject, $bodyText, $headers);
}

if ($success) {
    echo json_encode(['success' => true, 'message' => '¡Formulario enviado con éxito!']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No se pudo enviar el correo desde el servidor.']);
}
?>
