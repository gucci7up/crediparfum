<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Obtener historial de pagos
        if (isset($_GET['invoice_id'])) {
            $stmt = $pdo->prepare("SELECT * FROM payments WHERE invoice_id = ? ORDER BY date DESC");
            $stmt->execute([$_GET['invoice_id']]);
            echo json_encode($stmt->fetchAll());
        } else {
            $stmt = $pdo->query("SELECT p.*, i.client_id, c.name as client_name FROM payments p JOIN invoices i ON p.invoice_id = i.id JOIN clients c ON i.client_id = c.id ORDER BY p.date DESC");
            echo json_encode($stmt->fetchAll());
        }
        break;

    case 'POST':
        // Registrar un nuevo pago (abono)
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['invoice_id']) && isset($data['amount'])) {
            try {
                $pdo->beginTransaction();

                $stmt = $pdo->prepare("INSERT INTO payments (invoice_id, amount, payment_method) VALUES (?, ?, ?)");
                $stmt->execute([
                    $data['invoice_id'], 
                    $data['amount'],
                    $data['payment_method'] ?? 'Efectivo'
                ]);

                // Verificar si la factura ya se pagó por completo
                // Sumar todos los pagos
                $stmtTotal = $pdo->prepare("SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?");
                $stmtTotal->execute([$data['invoice_id']]);
                $paid = $stmtTotal->fetch()['total_paid'];

                // Obtener total de factura
                $stmtInv = $pdo->prepare("SELECT total_amount FROM invoices WHERE id = ?");
                $stmtInv->execute([$data['invoice_id']]);
                $total_amount = $stmtInv->fetch()['total_amount'];

                if ($paid >= $total_amount) {
                    $stmtUpdate = $pdo->prepare("UPDATE invoices SET status = 'paid' WHERE id = ?");
                    $stmtUpdate->execute([$data['invoice_id']]);
                }

                $pdo->commit();
                http_response_code(201);
                echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);

            } catch (Exception $e) {
                $pdo->rollBack();
                http_response_code(500);
                echo json_encode(["error" => "Error al registrar el pago"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "invoice_id y amount son requeridos"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método no permitido"]);
        break;
}
?>
