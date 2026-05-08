<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // 1. Ingresos del mes actual (facturas en efectivo + abonos recibidos este mes)
        // Usar YEAR() y MONTH() para evitar problemas de formato de fecha con LIKE
        
        // Ingresos en efectivo este mes
        $stmtCash = $pdo->query("
            SELECT COALESCE(SUM(total_amount), 0) as cash_income 
            FROM invoices 
            WHERE type = 'cash' 
            AND YEAR(date) = YEAR(NOW()) 
            AND MONTH(date) = MONTH(NOW())
        ");
        $cashIncome = $stmtCash->fetch()['cash_income'];

        // Abonos recibidos este mes
        $stmtPayments = $pdo->query("
            SELECT COALESCE(SUM(amount), 0) as payment_income 
            FROM payments 
            WHERE YEAR(date) = YEAR(NOW()) 
            AND MONTH(date) = MONTH(NOW())
        ");
        $paymentIncome = $stmtPayments->fetch()['payment_income'];

        $monthlyIncome = $cashIncome + $paymentIncome;

        // Mes anterior para calcular tendencia
        $stmtLastCash = $pdo->query("
            SELECT COALESCE(SUM(total_amount), 0) as cash_income 
            FROM invoices 
            WHERE type = 'cash' 
            AND YEAR(date) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
            AND MONTH(date) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
        ");
        $lastCashIncome = $stmtLastCash->fetch()['cash_income'];

        $stmtLastPay = $pdo->query("
            SELECT COALESCE(SUM(amount), 0) as payment_income 
            FROM payments 
            WHERE YEAR(date) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
            AND MONTH(date) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
        ");
        $lastPayIncome = $stmtLastPay->fetch()['payment_income'];
        $lastMonthIncome = $lastCashIncome + $lastPayIncome;

        // Calcular tendencia vs mes pasado
        if ($lastMonthIncome > 0) {
            $trendPct = round((($monthlyIncome - $lastMonthIncome) / $lastMonthIncome) * 100);
            $trend = ($trendPct >= 0 ? '+' : '') . $trendPct . '%';
            $isPositive = $trendPct >= 0;
        } else {
            $trend = '+0%';
            $isPositive = true;
        }

        // 2. Cuentas por Cobrar (deuda total pendiente de facturas de crédito)
        $stmtDebt = $pdo->query("
            SELECT 
                COALESCE(
                    SUM(i.total_amount) - COALESCE(
                        (SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 
                    0),
                0) as debt
            FROM invoices i
            WHERE i.type = 'credit' AND i.status = 'pending'
        ");
        $totalDebt = $stmtDebt->fetch()['debt'];
        if ($totalDebt < 0) $totalDebt = 0;

        // 3. Clientes activos
        $clientCount = $pdo->query("SELECT COUNT(*) as c FROM clients")->fetch()['c'];

        // 4. Actividad reciente (últimas 5 transacciones)
        $stmtRecent = $pdo->query("
            (SELECT 
                i.id as tx_id, 
                c.name as client, 
                i.total_amount as amount, 
                i.status, 
                DATE_FORMAT(i.date, '%Y-%m-%d %H:%i') as date, 
                'Venta' as type 
             FROM invoices i 
             JOIN clients c ON i.client_id = c.id
            )
            UNION ALL
            (SELECT 
                CONCAT('PAY-', p.id) as tx_id, 
                c.name as client, 
                p.amount as amount, 
                'Pagado' as status, 
                DATE_FORMAT(p.date, '%Y-%m-%d %H:%i') as date, 
                'Abono' as type 
             FROM payments p 
             JOIN invoices i ON p.invoice_id = i.id 
             JOIN clients c ON i.client_id = c.id
            )
            ORDER BY date DESC
            LIMIT 5
        ");
        $recentActivity = $stmtRecent->fetchAll();

        // 5. Notificaciones (facturas próximas a vencer o vencidas)
        $threshold = 3;
        try {
            $stmtSet = $pdo->query("SELECT alert_threshold_days FROM settings WHERE id = 1");
            $settings = $stmtSet->fetch();
            if ($settings && isset($settings['alert_threshold_days'])) {
                $threshold = (int)$settings['alert_threshold_days'];
            }
        } catch (Exception $e) {}

        $stmtNotifs = $pdo->prepare("
            SELECT 
                i.id, 
                c.name as client, 
                i.total_amount, 
                DATE_FORMAT(i.due_date, '%Y-%m-%d') as due_date,
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
