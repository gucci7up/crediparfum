<?php
require_once 'db.php';

// Headers are already set in db.php, but let's be sure
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT * FROM settings WHERE id = 1");
            $settings = $stmt->fetch();
            if (!$settings) {
                // If no settings exist, create default
                $pdo->exec("INSERT IGNORE INTO settings (id, business_name) VALUES (1, 'CrediParfum')");
                $stmt = $pdo->query("SELECT * FROM settings WHERE id = 1");
                $settings = $stmt->fetch();
            }
            echo json_encode($settings);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error al obtener configuración: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if ($data) {
            try {
                // Ensure record exists
                $exists = $pdo->query("SELECT id FROM settings WHERE id = 1")->fetch();
                
                if ($exists) {
                    $sql = "UPDATE settings SET 
                        business_name = ?, 
                        business_logo = ?, 
                        business_address = ?, 
                        business_phone = ?, 
                        currency = ?,
                        credit_term_days = ?,
                        alert_threshold_days = ?
                        WHERE id = 1";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([
                        $data['business_name'] ?? 'CrediParfum',
                        $data['business_logo'] ?? null,
                        $data['business_address'] ?? null,
                        $data['business_phone'] ?? null,
                        $data['currency'] ?? '$',
                        $data['credit_term_days'] ?? 30,
                        $data['alert_threshold_days'] ?? 3
                    ]);
                } else {
                    $sql = "INSERT INTO settings (id, business_name, business_logo, business_address, business_phone, currency, credit_term_days, alert_threshold_days) VALUES (1, ?, ?, ?, ?, ?, ?, ?)";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([
                        $data['business_name'] ?? 'CrediParfum',
                        $data['business_logo'] ?? null,
                        $data['business_address'] ?? null,
                        $data['business_phone'] ?? null,
                        $data['currency'] ?? '$',
                        $data['credit_term_days'] ?? 30,
                        $data['alert_threshold_days'] ?? 3
                    ]);
                }
                echo json_encode(["success" => true, "message" => "Configuración guardada"]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => "Error de base de datos: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Datos JSON inválidos o vacíos"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método no permitido"]);
        break;
}
?>
