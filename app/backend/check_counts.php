<?php
define('CLI_MODE', true);
require_once 'db.php';
$tables = ['clients', 'invoices', 'payments'];
$results = [];
foreach($tables as $t) {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM $t");
        $results[$t] = $stmt->fetch()['count'];
    } catch(Exception $e) {
        $results[$t] = "Error: " . $e->getMessage();
    }
}
echo json_encode($results, JSON_PRETTY_PRINT);
?>
