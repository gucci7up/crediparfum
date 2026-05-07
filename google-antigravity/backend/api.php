<?php
// Configurar cabeceras CORS para permitir peticiones desde cualquier origen (en desarrollo)
// En producción, deberías restringir 'Access-Control-Allow-Origin' al dominio de tu frontend.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Manejar la petición OPTIONS para CORS (pre-flight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Asegurarse de que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit();
}

// Credenciales de la base de datos
// Estas variables de entorno pueden ser configuradas en Dokploy o en un archivo .env
$host = getenv('DB_HOST') ?: 'db'; // 'db' es un nombre común en docker-compose, o puedes usar 'localhost'
$dbname = getenv('DB_NAME') ?: 'google_antigravity';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';

try {
    // Conexión PDO
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    // Configurar PDO para que lance excepciones en caso de error
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Leer el JSON del cuerpo de la petición
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, true);

    // Validar el input
    if (!isset($input['event_type'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Bad Request: event_type is required']);
        exit();
    }

    $event_type = $input['event_type'];

    // Insertar en la base de datos
    $stmt = $pdo->prepare("INSERT INTO interactions (event_type) VALUES (:event_type)");
    $stmt->bindParam(':event_type', $event_type);
    $stmt->execute();

    // Respuesta exitosa
    http_response_code(201);
    echo json_encode([
        'status' => 'success',
        'message' => 'Interaction logged successfully',
        'id' => $pdo->lastInsertId()
    ]);

} catch (PDOException $e) {
    // Manejo de errores de base de datos
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'message' => $e->getMessage() // Nota: en producción, es mejor no mostrar el error detallado
    ]);
}
?>
