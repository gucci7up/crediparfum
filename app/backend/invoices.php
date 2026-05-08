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
                // Status: cash=paid, credit=pending, quote=draft
                if ($type === 'credit') $status = 'pending';
                else if ($type === 'quote') $status = 'draft';
                else $status = 'paid';
                $shipping_cost = isset($data['shipping_cost']) ? floatval($data['shipping_cost']) : 0;
                $due_date = isset($data['due_date']) ? $data['due_date'] : null;
                
                $stmt = $pdo->prepare("INSERT INTO invoices (client_id, subtotal, shipping_cost, total_amount, type, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
                
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
                    $status,
                    $due_date
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

    case 'PUT':
        // Convertir cotización en factura
        if (isset($_GET['id']) && $_GET['action'] === 'convert') {
            $id = intval($_GET['id']);
            try {
                $stmt = $pdo->prepare("UPDATE invoices SET type = 'cash', status = 'paid' WHERE id = ? AND type = 'quote'");
                $stmt->execute([$id]);
                if ($stmt->rowCount() > 0) {
                    echo json_encode(["success" => true]);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Cotización no encontrada o ya convertida"]);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Parámetros inválidos"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método no permitido"]);
        break;
}
?>
