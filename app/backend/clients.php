<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            // Obtener todos los clientes o uno específico
            if (isset($_GET['id'])) {
                $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                $client = $stmt->fetch();
                if ($client) {
                    echo json_encode($client);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Cliente no encontrado"]);
                }
            } else {
                $query = "
                    SELECT 
                        c.*,
                        COALESCE((SELECT SUM(total_amount) FROM invoices WHERE client_id = c.id AND type = 'credit'), 0) - 
                        COALESCE((SELECT SUM(amount) FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE i.client_id = c.id AND i.type = 'credit'), 0) 
                        AS current_debt
                    FROM clients c
                    ORDER BY c.name ASC
                ";
                $stmt = $pdo->query($query);
                echo json_encode($stmt->fetchAll());
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error de base de datos", "details" => $e->getMessage(), "query" => $query ?? 'n/a']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error inesperado", "details" => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Crear un nuevo cliente
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['name'])) {
            $stmt = $pdo->prepare("INSERT INTO clients (name, phone, email, address, credit_limit) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['name'], 
                $data['phone'] ?? null, 
                $data['email'] ?? null, 
                $data['address'] ?? null, 
                $data['credit_limit'] ?? 0
            ]);
            $data['id'] = $pdo->lastInsertId();
            http_response_code(201);
            echo json_encode($data);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "El nombre es requerido"]);
        }
        break;

    case 'PUT':
        // Actualizar un cliente
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($_GET['id']) && isset($data['name'])) {
            $stmt = $pdo->prepare("UPDATE clients SET name=?, phone=?, email=?, address=?, credit_limit=? WHERE id=?");
            $stmt->execute([
                $data['name'], 
                $data['phone'] ?? null, 
                $data['email'] ?? null, 
                $data['address'] ?? null, 
                $data['credit_limit'] ?? 0,
                $_GET['id']
            ]);
            echo json_encode(["success" => true]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID y nombre son requeridos"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método no permitido"]);
        break;
}
?>
