<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Ingresos en efectivo este mes (excluye cotizaciones)
        $stmtCash = $pdo->query("
            SELECT COALESCE(SUM(total_amount), 0) as cash_income 
            FROM invoices 
            WHERE type = 'cash' 
            AND YEAR(date) = YEAR(NOW()) 
            AND MONTH(date) = MONTH(NOW())
        ");
        $cashIncome = (float)$stmtCash->fetch()['cash_income'];

        // Abonos recibidos este mes
        $stmtPayments = $pdo->query("
            SELECT COALESCE(SUM(amount), 0) as payment_income 
            FROM payments 
            WHERE YEAR(date) = YEAR(NOW()) 
            AND MONTH(date) = MONTH(NOW())
        ");
        $paymentIncome = (float)$stmtPayments->fetch()['payment_income'];

        $monthlyIncome = $cashIncome + $paymentIncome;

        // Mes anterior para tendencia
        $stmtLastMonth = $pdo->query("
            SELECT COALESCE(SUM(total_amount), 0) as income
            FROM invoices 
            WHERE type = 'cash' 
            AND YEAR(date) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
            AND MONTH(date) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
        ");
        $lastMonthIncome = (float)$stmtLastMonth->fetch()['income'];

        if ($lastMonthIncome > 0) {
            $trendPct = round((($monthlyIncome - $lastMonthIncome) / $lastMonthIncome) * 100);
            $trend = ($trendPct >= 0 ? '+' : '') . $trendPct . '%';
            $isPositive = $trendPct >= 0;
        } else {
            $trend = '+0%';
            $isPositive = true;
        }

        // 2. Cuentas por Cobrar (solo facturas de crédito, excluye cotizaciones)
        $totalCredit = (float)$pdo->query("
            SELECT COALESCE(SUM(total_amount), 0) as t 
            FROM invoices 
            WHERE type = 'credit' AND status = 'pending'
        ")->fetch()['t'];

        // Total pagado en esas facturas
        $totalPaid = (float)$pdo->query("
            SELECT COALESCE(SUM(p.amount), 0) as t 
            FROM payments p 
            JOIN invoices i ON p.invoice_id = i.id 
            WHERE i.type = 'credit' AND i.status = 'pending'
        ")->fetch()['t'];

        $totalDebt = max(0, $totalCredit - $totalPaid);

        // 3. Clientes activos
        $clientCount = (int)$pdo->query("SELECT COUNT(*) as c FROM clients")->fetch()['c'];

        // 4. Actividad reciente (últimas 5)
        $recentActivity = [];
        try {
            $stmtRecent = $pdo->query("
                SELECT tx_id, client, amount, status, date, type FROM (
                    SELECT 
                        CAST(i.id AS CHAR) as tx_id,
                        c.name as client,
                        i.total_amount as amount,
                        i.status,
                        i.date,
                        'Venta' as type
                    FROM invoices i 
                    JOIN clients c ON i.client_id = c.id
                    UNION ALL
                    SELECT 
                        CONCAT('PAY-', CAST(p.id AS CHAR)) as tx_id,
                        c.name as client,
                        p.amount,
                        'Pagado' as status,
                        p.date,
                        'Abono' as type
                    FROM payments p 
                    JOIN invoices i ON p.invoice_id = i.id 
                    JOIN clients c ON i.client_id = c.id
                ) as activity
                ORDER BY date DESC
                LIMIT 5
            ");
            $recentActivity = $stmtRecent->fetchAll();
        } catch (Exception $e) {
            // No bloquear si falla actividad reciente
        }

        // 5. Notificaciones de cobro
        $threshold = 3;
        try {
            $settingsRow = $pdo->query("SELECT alert_threshold_days FROM settings WHERE id = 1")->fetch();
            if ($settingsRow) $threshold = (int)$settingsRow['alert_threshold_days'];
        } catch (Exception $e) {}

        $notifications = [];
        try {
            $stmtNotifs = $pdo->prepare("
                SELECT 
                    i.id,
                    c.name as client,
                    i.total_amount,
                    i.due_date,
                    CASE 
                        WHEN i.due_date < NOW() THEN 'Vencida'
                        ELSE 'Próxima a vencer'
                    END as alert_type
                FROM invoices i 
                JOIN clients c ON i.client_id = c.id
                WHERE i.status = 'pending' 
                AND i.due_date IS NOT NULL
                AND i.due_date <= DATE_ADD(NOW(), INTERVAL ? DAY)
                ORDER BY i.due_date ASC
                LIMIT 10
            ");
            $stmtNotifs->execute([$threshold]);
            $notifications = $stmtNotifs->fetchAll();
        } catch (Exception $e) {}

        echo json_encode([
            "stats" => [
                [
                    "name"       => "Ingresos Mensuales",
                    "value"      => "$" . number_format($monthlyIncome, 2),
                    "trend"      => $trend,
                    "isPositive" => $isPositive,
                    "id"         => "monthly_income"
                ],
                [
                    "name"       => "Cuentas por Cobrar",
                    "value"      => "$" . number_format($totalDebt, 2),
                    "trend"      => "Pendiente",
                    "isPositive" => false,
                    "id"         => "accounts_receivable"
                ],
                [
                    "name"       => "Clientes Activos",
                    "value"      => (string)$clientCount,
                    "trend"      => "+0",
                    "isPositive" => true,
                    "id"         => "active_clients"
                ]
            ],
            "recentActivity" => $recentActivity,
            "notifications"  => $notifications
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
