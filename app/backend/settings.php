<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM settings WHERE id = 1");
        $settings = $stmt->fetch();
        echo json_encode($settings ?: new stdClass());
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if ($data) {
            // Check if settings exist
            $exists = $pdo->query("SELECT id FROM settings WHERE id = 1")->fetch();
            
            if ($exists) {
                $sql = "UPDATE settings SET 
                    business_name = ?, 
                    business_logo = ?, 
                    business_address = ?, 
                    business_phone = ?, 
                    currency = ? 
                    WHERE id = 1";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $data['business_name'] ?? 'CrediParfum',
                    $data['business_logo'] ?? null,
                    $data['business_address'] ?? null,
                    $data['business_phone'] ?? null,
                    $data['currency'] ?? '$'
                ]);
            } else {
                $sql = "INSERT INTO settings (id, business_name, business_logo, business_address, business_phone, currency) VALUES (1, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $data['business_name'] ?? 'CrediParfum',
                    $data['business_logo'] ?? null,
                    $data['business_address'] ?? null,
                    $data['business_phone'] ?? null,
                    $data['currency'] ?? '$'
                ]);
            }
            echo json_encode(["success" => true]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Datos inválidos"]);
        }
        break;

    default:
        http_response_code(405);
        break;
}
?>
