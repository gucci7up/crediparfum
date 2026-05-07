<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $product = $stmt->fetch();
            if ($product) {
                echo json_encode($product);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Producto no encontrado"]);
            }
        } else {
            $stmt = $pdo->query("SELECT * FROM products ORDER BY name ASC");
            echo json_encode($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['name']) && isset($data['price'])) {
            $stmt = $pdo->prepare("INSERT INTO products (name, brand, price, stock) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $data['name'], 
                $data['brand'] ?? null, 
                $data['price'], 
                $data['stock'] ?? 0
            ]);
            $data['id'] = $pdo->lastInsertId();
            http_response_code(201);
            echo json_encode($data);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "El nombre y el precio son requeridos"]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($_GET['id']) && isset($data['name']) && isset($data['price'])) {
            $stmt = $pdo->prepare("UPDATE products SET name=?, brand=?, price=?, stock=? WHERE id=?");
            $stmt->execute([
                $data['name'], 
                $data['brand'] ?? null, 
                $data['price'], 
                $data['stock'] ?? 0,
                $_GET['id']
            ]);
            echo json_encode(["success" => true]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "ID, nombre y precio son requeridos"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método no permitido"]);
        break;
}
?>
