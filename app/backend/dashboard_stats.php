<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // 1. Ingresos Mensuales (Suma de pagos en el mes actual + ventas de contado del mes actual)
        // Nota: Las ventas de contado se consideran pagadas inmediatamente, pero el sistema de pagos 
        // podría no tener un registro explícito para cada venta de contado si se maneja por 'status'.
        // Sin embargo, para mayor precisión, sumaremos el total de facturas 'cash' del mes 
        // Y los pagos registrados en el mes para facturas 'credit'.
        
        $currentMonth = date('Y-m');
        
        // Ingresos por contado este mes
        $stmtCash = $pdo->prepare("SELECT COALESCE(SUM(total_amount), 0) as cash_income FROM invoices WHERE type = 'cash' AND date LIKE ?");
        $stmtCash->execute([$currentMonth . '%']);
        $cashIncome = $stmtCash->fetch()['cash_income'];
        
        // Ingresos por abonos este mes
        $stmtPayments = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as payment_income FROM payments WHERE date LIKE ?");
        $stmtPayments->execute([$currentMonth . '%']);
        $paymentIncome = $stmtPayments->fetch()['payment_income'];
        
        $monthlyIncome = $cashIncome + $paymentIncome;

        // 2. Cuentas por Cobrar (Deuda total de todas las facturas de crédito pendientes)
        $queryDebt = "
            SELECT 
                COALESCE(SUM(total_amount), 0) - 
                COALESCE((SELECT SUM(p.amount) FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE i.type = 'credit'), 0) 
                as total_debt
            FROM invoices 
            WHERE type = 'credit'
        ";
        $stmtDebt = $pdo->query($queryDebt);
        $totalDebt = $stmtDebt->fetch()['total_debt'];

        // 3. Clientes Activos
        $stmtClients = $pdo->query("SELECT COUNT(*) as client_count FROM clients");
        $clientCount = $stmtClients->fetch()['client_count'];

        // 4. Actividad Reciente (Últimas 5 facturas o pagos)
        $stmtRecent = $pdo->query("
            (SELECT i.id as tx_id, c.name as client, i.total_amount as amount, i.status, i.date, 'Venta' as type 
             FROM invoices i JOIN clients c ON i.client_id = c.id)
            UNION
            (SELECT CONCAT('PAY-', p.id) as tx_id, c.name as client, p.amount as amount, 'Pagado' as status, p.date, 'Abono' as type 
             FROM payments p JOIN invoices i ON p.invoice_id = i.id JOIN clients c ON i.client_id = c.id)
            ORDER BY date DESC
            LIMIT 5
        ");
        $recentActivity = $stmtRecent->fetchAll();

        echo json_encode([
            "stats" => [
                [
                    "name" => "Ingresos Mensuales",
                    "value" => "$" . number_format($monthlyIncome, 2),
                    "trend" => "+0%", // Placeholder
                    "isPositive" => true,
                    "id" => "monthly_income"
                ],
                [
                    "name" => "Cuentas por Cobrar",
                    "value" => "$" . number_format($totalDebt, 2),
                    "trend" => "Pendiente",
                    "isPositive" => false,
                    "id" => "accounts_receivable"
                ],
                [
                    "name" => "Clientes Activos",
                    "value" => (string)$clientCount,
                    "trend" => "+0",
                    "isPositive" => true,
                    "id" => "active_clients"
                ]
            ],
            "recentActivity" => $recentActivity
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
}
?>
