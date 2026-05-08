<?php
require_once 'db.php';
$tables = ['clients', 'invoices', 'invoice_items', 'payments', 'settings'];
$counts = [];
foreach ($tables as $t) {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as c FROM $t");
        $counts[$t] = $stmt->fetch()['c'];
    } catch (Exception $e) {
        $counts[$t] = "Error: " . $e->getMessage();
    }
}
echo json_encode($counts, JSON_PRETTY_PRINT);
?>
