<?php

// 他のサイト（Reactの開発環境など）からのアクセスを許可する設定
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// エラーを表示しない（JSON形式が崩れるのを防ぐため）
ini_set('display_errors', 0);
error_reporting(0);

// ▼▼▼ 設定エリア ▼▼▼
$db_host = 'localhost';
$db_name = 'gcg_app';
$db_user = 'gcg_user';
$db_password = 'password123'; // ←ここを変更！
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲

try {
    // データベース接続
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_password);

    // 検索パラメータの受け取り（今回はシンプルに全件取得またはキーワード検索）
    $keyword = isset($_GET['q']) ? $_GET['q'] : '';
    $color   = isset($_GET['color']) ? $_GET['color'] : '';

    // 基本のSQL
    $sql = "SELECT * FROM cards WHERE 1=1";
    $params = [];

    // キーワードがあれば、名前・テキスト・特徴から検索
    if ($keyword) {
        $sql .= " AND (name LIKE :kw OR text LIKE :kw OR traits LIKE :kw)";
        $params[':kw'] = "%$keyword%";
    }

    // 色指定があれば絞り込み
    if ($color) {
        $sql .= " AND color = :color";
        $params[':color'] = $color;
    }

    // ID順に並べて取得
    $sql .= " ORDER BY id ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // JSONとして出力
    echo json_encode($cards, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    // エラー時は空の配列などを返す、またはエラーメッセージをJSONで返す
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}