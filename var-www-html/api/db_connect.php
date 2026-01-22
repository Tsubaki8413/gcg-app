<?php
// api/db_connect.php

// CORS設定 (Reactからのアクセスを許可)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// OPTIONSリクエスト（プリフライト）の場合はここで終了
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// DB設定
$host = 'localhost';
$dbname = 'gcg_app';
$username = 'gcg_user';
$password = 'password123'; // setupの時と同じパスワード

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit;
}
