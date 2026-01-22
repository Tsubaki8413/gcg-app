<?php
// /var/www/html/api/get_cards.php

// ▼▼▼ 追加: 出力バッファリング開始（エラーメッセージ混入防止） ▼▼▼
ob_start();

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// ▼▼▼ 追加: エラーを画面に出さない（JSONを壊さないため） ▼▼▼
ini_set('display_errors', 0);

require_once 'db_connect.php';

try {
    // 検索パラメータの取得
    $search = isset($_GET['search']) ? $_GET['search'] : '';

    // フィルタ項目の取得
    $colors = isset($_GET['colors']) ? $_GET['colors'] : [];
    $types = isset($_GET['types']) ? $_GET['types'] : [];
    $rarities = isset($_GET['rarities']) ? $_GET['rarities'] : [];
    $sets = isset($_GET['sets']) ? $_GET['sets'] : [];
    $zones = isset($_GET['zones']) ? $_GET['zones'] : [];
    $traits = isset($_GET['traits']) ? $_GET['traits'] : '';

    // 範囲検索パラメータ
    $costs = isset($_GET['costs']) ? $_GET['costs'] : [];
    $ap_min = isset($_GET['ap_min']) ? $_GET['ap_min'] : null;
    $ap_max = isset($_GET['ap_max']) ? $_GET['ap_max'] : null;
    $hp_min = isset($_GET['hp_min']) ? $_GET['hp_min'] : null;
    $hp_max = isset($_GET['hp_max']) ? $_GET['hp_max'] : null;

    // ソート
    $sort = isset($_GET['sort']) ? $_GET['sort'] : 'id';
    $order = isset($_GET['order']) ? $_GET['order'] : 'asc';

    // SQL構築
    $sql = "SELECT * FROM cards WHERE 1=1";
    $params = [];

    // 1. フリーワード検索
    if (!empty($search)) {
        $sql .= " AND (id LIKE ? OR name LIKE ? OR text LIKE ? OR traits LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    // 2. 詳細フィルタ (ヘルパー関数)
    function addOrCondition(&$sql, &$params, $col, $values, $isLike = false) {
        if (!empty($values)) {
            if (!is_array($values)) {
                $values = explode(',', $values);
            }
            $clauses = [];
            foreach ($values as $val) {
                if ($isLike) {
                    $clauses[] = "$col LIKE ?";
                    $params[] = "%$val%";
                } else {
                    $clauses[] = "$col = ?";
                    $params[] = $val;
                }
            }
            if (!empty($clauses)) {
                $sql .= " AND (" . implode(' OR ', $clauses) . ")";
            }
        }
    }

    // 各フィルタ適用
    addOrCondition($sql, $params, 'color', $colors, true);
    addOrCondition($sql, $params, 'type', $types, false);
    addOrCondition($sql, $params, 'rarity', $rarities, false);
    addOrCondition($sql, $params, 'expansion_set', $sets, false);
    addOrCondition($sql, $params, 'zone', $zones, true);
    addOrCondition($sql, $params, 'cost', $costs, false);

    // 3. 範囲検索
    if ($ap_min !== null && $ap_min !== '') {
        $sql .= " AND ap >= ?";
        $params[] = $ap_min;
    }
    if ($ap_max !== null && $ap_max !== '') {
        $sql .= " AND ap <= ?";
        $params[] = $ap_max;
    }

    if ($hp_min !== null && $hp_min !== '') {
        $sql .= " AND hp >= ?";
        $params[] = $hp_min;
    }
    if ($hp_max !== null && $hp_max !== '') {
        $sql .= " AND hp <= ?";
        $params[] = $hp_max;
    }

    // 4. 特徴検索
    addOrCondition($sql, $params, 'traits', $traits, true);


    // 5. ソート (SQL側)
    if ($sort !== 'id') {
        $sql .= " ORDER BY $sort $order";
    }

    // 実行
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // IDのNatural Sort
    if ($sort === 'id') {
        usort($cards, function($a, $b) use ($order) {
            $res = strnatcasecmp($a['id'], $b['id']);
            return ($order === 'desc') ? -$res : $res;
        });
    }

    // ▼▼▼ ここが重要: JSON化して出力 ▼▼▼
    $json = json_encode($cards, JSON_INVALID_UTF8_IGNORE | JSON_UNESCAPED_UNICODE);

    // 途中でWarningなどが出ていても、バッファをクリアして消し去る
    ob_clean();

    if ($json === false) {
        http_response_code(500);
        echo json_encode(["error" => "JSON Encoding Error: " . json_last_error_msg()]);
    } else {
        echo $json;
    }
    // ▲▲▲ ここまで ▲▲▲

} catch (Exception $e) { // PDOExceptionも含めてすべてのエラーをキャッチ
    ob_clean(); // エラー時もバッファをクリアしてきれいなJSONを返す
    http_response_code(500);
    echo json_encode(["error" => "Server Error: " . $e->getMessage()]);
}
