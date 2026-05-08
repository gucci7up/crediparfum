<?php
// Permitir peticiones desde cualquier origen (CORS) - Útil para desarrollo local, en Dokploy el frontend y backend comparten dominio gracias a Nginx.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header('Content-Type: application/json');

date_default_timezone_set('America/Santo_Domingo');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$host = getenv('DB_HOST') ?: 'db';
$dbname = getenv('DB_NAME') ?: 'crediparfum';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: 'rootpassword';

try {
    // 1. Conectar al servidor MySQL sin especificar base de datos primero
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 2. Crear la base de datos si no existe
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    // 3. Conectar a la base de datos específica
    $pdo->exec("USE `$dbname` ");
    
    // 4. Verificar si las tablas existen, si no, crearlas
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    if (empty($tables)) {
        $sql = file_get_contents(__DIR__ . '/schema.sql');
        $pdo->exec($sql);
    } else {
        // Asegurar que la tabla settings existe para actualizaciones incrementales
        $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
            id INT PRIMARY KEY DEFAULT 1,
            business_name VARCHAR(255) DEFAULT 'CrediParfum',
            business_logo LONGTEXT,
            business_address TEXT,
            business_phone VARCHAR(50),
            currency VARCHAR(10) DEFAULT '$',
            credit_term_days INT DEFAULT 30,
            alert_threshold_days INT DEFAULT 3
        )");
        
        // Ensure columns exist for incremental updates
        try { $pdo->exec("ALTER TABLE settings ADD COLUMN credit_term_days INT DEFAULT 30"); } catch (Exception $e) {}
        try { $pdo->exec("ALTER TABLE settings ADD COLUMN alert_threshold_days INT DEFAULT 3"); } catch (Exception $e) {}
        
        // Insertar registro inicial si no existe
        $pdo->exec("INSERT IGNORE INTO settings (id, business_name) VALUES (1, 'CrediParfum')");
    }
    
    // Re-conectar con la base de datos seleccionada para asegurar consistencia
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Fallo total de conexión SQL",
        "host" => $host,
        "database" => $dbname,
        "user" => $user,
        "details" => $e->getMessage()
    ]);
    exit();
}
?>
