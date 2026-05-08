<?php
require_once 'db.php';
try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM invoices");
    $invoices = $stmt->fetch();
    
    $stmt2 = $pdo->query("SELECT COUNT(*) as count FROM clients");
    $clients = $stmt2->fetch();
    
    $stmt3 = $pdo->query("SELECT * FROM settings WHERE id = 1");
    $settings = $stmt3->fetch();
    
    echo json_encode([
        "invoices_count" => $invoices['count'],
        "clients_count" => $clients['count'],
        "settings" => $settings,
        "php_version" => PHP_VERSION,
        "date" => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
