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
                $stmtItems = $pdo->prepare("SELECT ii.*, p.name as product_name FROM invoice_items ii LEFT JOIN products p ON ii.product_id = p.id WHERE ii.invoice_id = ?");
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
                
                $stmt = $pdo->prepare("INSERT INTO invoices (client_id, total_amount, type, status) VALUES (?, ?, ?, ?)");
                // Calcularemos el total sumando los items para evitar inconsistencias
                $total_amount = 0;
                foreach ($data['items'] as $item) {
                    $total_amount += ($item['quantity'] * $item['unit_price']);
                }

                $stmt->execute([
                    $data['client_id'], 
                    $total_amount,
                    $type,
                    $status
                ]);
                $invoice_id = $pdo->lastInsertId();

                // 2. Insertar items y actualizar stock
                $stmtItem = $pdo->prepare("INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)");
                $stmtStock = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

                foreach ($data['items'] as $item) {
                    $subtotal = $item['quantity'] * $item['unit_price'];
                    $stmtItem->execute([
                        $invoice_id,
                        $item['product_id'],
                        $item['quantity'],
                        $item['unit_price'],
                        $subtotal
                    ]);
                    
                    // Restar del inventario
                    $stmtStock->execute([$item['quantity'], $item['product_id']]);
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
