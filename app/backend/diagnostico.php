<?php
// SCRIPT DE DIAGNOSTICO - Solo para uso temporal
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = getenv('DB_HOST') ?: 'db';
$dbname = getenv('DB_NAME') ?: 'crediparfum';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: 'rootpassword';

$report = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'env_vars' => [
        'DB_HOST' => $host,
        'DB_NAME' => $dbname,
        'DB_USER' => $user,
        'DB_PASS' => $pass ? '***SET***' : 'NOT SET'
    ],
    'connection' => 'FAILED',
    'tables' => [],
    'counts' => [],
    'sample_invoices' => [],
    'error' => null
];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $report['connection'] = 'OK';

    // Listar tablas
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $report['tables'] = $tables;

    // Contar registros
    foreach ($tables as $t) {
        try {
            $count = $pdo->query("SELECT COUNT(*) as c FROM `$t`")->fetch()['c'];
            $report['counts'][$t] = (int)$count;
        } catch (Exception $e) {
            $report['counts'][$t] = 'Error: ' . $e->getMessage();
        }
    }

    // Muestra de facturas
    if (in_array('invoices', $tables)) {
        $report['sample_invoices'] = $pdo->query("SELECT id, client_id, total_amount, type, status, date FROM invoices ORDER BY id DESC LIMIT 5")->fetchAll();
    }

    // Test del dashboard_stats
    if (in_array('invoices', $tables) && in_array('payments', $tables)) {
        $currentMonth = date('Y-m');
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount), 0) as cash_income FROM invoices WHERE type = 'cash' AND date LIKE ?");
        $stmt->execute([$currentMonth . '%']);
        $report['dashboard_test']['cash_income_this_month'] = $stmt->fetch()['cash_income'];

        $stmt2 = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices");
        $report['dashboard_test']['total_all_invoices'] = $stmt2->fetch()['total'];

        $stmt3 = $pdo->query("SELECT COUNT(*) as c FROM clients");
        $report['dashboard_test']['total_clients'] = $stmt3->fetch()['c'];
    }

} catch (PDOException $e) {
    $report['error'] = $e->getMessage();
}

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
