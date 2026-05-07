<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Obtener facturas (con detalles opcionales)
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?");
            $stmt->execute([$_GET['id']]);
            $invoice = $stmt->fetch();
            if ($invoice) {
                // Obtener items
                $stmtItems = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id = ?");
                $stmtItems->execute([$invoice['id']]);
                $invoice['items'] = $stmtItems->fetchAll();
                echo json_encode($invoice);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Factura no encontrada"]);
            }
        } else {
            $stmt = $pdo->query("SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id ORDER BY i.date DESC");
            echo json_encode($stmt->fetchAll());
        }
        break;

    case 'POST':
        // Crear una nueva factura
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['client_id']) && isset($data['items']) && is_array($data['items'])) {
            try {
                $pdo->beginTransaction();

                // 1. Insertar factura
                $type = $data['type'] ?? 'cash';
                $status = $type === 'credit' ? 'pending' : 'paid'; // Si es crédito, queda pendiente
                $shipping_cost = isset($data['shipping_cost']) ? floatval($data['shipping_cost']) : 0;
                
                $stmt = $pdo->prepare("INSERT INTO invoices (client_id, subtotal, shipping_cost, total_amount, type, status) VALUES (?, ?, ?, ?, ?, ?)");
                
                $subtotal = 0;
                foreach ($data['items'] as $item) {
                    $subtotal += ($item['quantity'] * $item['unit_price']);
                }
                $total_amount = $subtotal + $shipping_cost;

                $stmt->execute([
                    $data['client_id'], 
                    $subtotal,
                    $shipping_cost,
                    $total_amount,
                    $type,
                    $status
                ]);
                $invoice_id = $pdo->lastInsertId();

                // 2. Insertar items
                $stmtItem = $pdo->prepare("INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)");

                foreach ($data['items'] as $item) {
                    $item_subtotal = $item['quantity'] * $item['unit_price'];
                    $stmtItem->execute([
                        $invoice_id,
                        $item['description'],
                        $item['quantity'],
                        $item['unit_price'],
                        $item_subtotal
                    ]);
                }

                $pdo->commit();
                http_response_code(201);
                echo json_encode(["success" => true, "invoice_id" => $invoice_id, "total" => $total_amount]);

            } catch (Exception $e) {
                $pdo->rollBack();
                http_response_code(500);
                echo json_encode(["error" => "Error al crear la factura", "details" => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Datos incompletos"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método no permitido"]);
        break;
}
?>
