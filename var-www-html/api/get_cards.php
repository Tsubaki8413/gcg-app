<?php
// /var/www/html/api/get_cards.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'db_connect.php';

try {
    // 検索パラメータの取得
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    
    // フィルタ項目の取得（配列で来ることを想定）
    // URL例: ?colors[]=Red&colors[]=Blue&ap_min=3000
    $colors = isset($_GET['colors']) ? $_GET['colors'] : [];
    $types = isset($_GET['types']) ? $_GET['types'] : [];
    $rarities = isset($_GET['rarities']) ? $_GET['rarities'] : [];
    $sets = isset($_GET['sets']) ? $_GET['sets'] : [];
    $zones = isset($_GET['zones']) ? $_GET['zones'] : [];
    $traits = isset($_GET['traits']) ? $_GET['traits'] : ''; // 特徴はカンマ区切り等の文字列または配列

    // 範囲検索パラメータ
    $costs = isset($_GET['costs']) ? $_GET['costs'] : []; // コストは複数選択(OR)のままか、範囲にするか。今回は選択式(OR)と想定
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
    $types_string = ""; 

    // 1. フリーワード検索 (ID, Name, Text, Traits) - ここはANDで絞り込み
    if (!empty($search)) {
        $sql .= " AND (id LIKE ? OR name LIKE ? OR text LIKE ? OR traits LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    // ---------------------------------------------------------
    // 2. 詳細フィルタ (複数選択は OR 条件で結合)
    // ---------------------------------------------------------

    // ヘルパー関数: 配列を受け取り "AND (col LIKE ? OR col LIKE ?)" を生成
    function addOrCondition(&$sql, &$params, $col, $values, $isLike = false) {
        if (!empty($values)) {
            if (!is_array($values)) {
                $values = explode(',', $values); // カンマ区切り文字列なら配列化
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

    // 色 (OR)
    addOrCondition($sql, $params, 'color', $colors, true);

    // タイプ (OR)
    addOrCondition($sql, $params, 'type', $types, false);

    // レアリティ (OR)
    addOrCondition($sql, $params, 'rarity', $rarities, false);

    // 収録セット (OR)
    addOrCondition($sql, $params, 'expansion_set', $sets, false);

    // 地形 (OR)
    addOrCondition($sql, $params, 'zone', $zones, true);

    // コスト (OR) - 完全一致で複数選択
    addOrCondition($sql, $params, 'cost', $costs, false);

    // ---------------------------------------------------------
    // 3. 範囲検索 (AP / HP)
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // 4. 特徴検索 (Traits) - OR検索
    // ---------------------------------------------------------
    // 特徴がカンマ区切り等で送られてきた場合
    addOrCondition($sql, $params, 'traits', $traits, true);


    // ---------------------------------------------------------
    // 5. ソート (Natural Sort 対応)
    // ---------------------------------------------------------
    // IDの場合はPHP側でソートするため、SQLでは一旦そのまま取得しても良いが、
    // ここではページングなし全件取得前提なので取得後にソートする
    // 数値系カラムのソートだけSQLでやっておくと楽
    if ($sort !== 'id') {
        $sql .= " ORDER BY $sort $order";
    }

    // 実行
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // IDのNatural Sort (ST01-2 < ST01-10)
    if ($sort === 'id') {
        usort($cards, function($a, $b) use ($order) {
            $res = strnatcasecmp($a['id'], $b['id']);
            return ($order === 'desc') ? -$res : $res;
        });
    }

    echo json_encode($cards);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}