<?php

// api/id_manager.php
require 'db_connect.php';

// POSTのみ許可
if ($_SERVER['REQUEST_METHOD'] !== 'POST') exit;

$input = json_decode(file_get_contents('php://input'), true);
$old_id = $input['old_id'] ?? '';
$new_id = strtoupper($input['new_id'] ?? '');

if (empty($old_id) || empty($new_id)) {
    http_response_code(400);
    echo json_encode(["error" => "Both old_id and new_id are required"]);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. CardsテーブルのIDチェック
    // 新しいIDが既に存在するかチェック
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM cards WHERE id = :new_id");
    $stmt->execute([':new_id' => $new_id]);
    if ($stmt->fetchColumn() > 0) {
        throw new Exception("New ID '$new_id' already exists. Cannot rename.");
    }

    // 古いIDが存在するかチェック
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM cards WHERE id = :old_id");
    $stmt->execute([':old_id' => $old_id]);
    if ($stmt->fetchColumn() == 0) {
        throw new Exception("Old ID '$old_id' not found.");
    }

    // 2. CardsテーブルのID更新
    // 外部キー制約を張っていないためUPDATEのみでOKだが、画像ファイルのリネームも必要ならここで行う
    // 今回はDB操作のみ行う
    $sql = "UPDATE cards SET id = :new_id, updated_at = NOW() WHERE id = :old_id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':new_id' => $new_id, ':old_id' => $old_id]);

    // 3. DecksテーブルのJSONデータ置換
    // SQLだけでJSONキーの置換をするのは難易度が高いため、PHPで処理するアプローチをとる
    // 該当IDを含むデッキを検索
    $stmt = $pdo->prepare("SELECT id, cards FROM decks WHERE cards LIKE :pattern FOR UPDATE");
    $stmt->execute([':pattern' => '%"' . $old_id . '":%']);
    $decks = $stmt->fetchAll();

    $updateStmt = $pdo->prepare("UPDATE decks SET cards = :cards, updated_at = NOW() WHERE id = :id");

    $updatedDecksCount = 0;
    foreach ($decks as $deck) {
        $deckId = $deck['id'];
        $cardsData = json_decode($deck['cards'], true);

        if (isset($cardsData[$old_id])) {
            // 枚数を取得
            $count = $cardsData[$old_id];
            // 新しいIDにセット
            $cardsData[$new_id] = $count;
            // 古いIDを削除
            unset($cardsData[$old_id]);

            // DB更新
            $newJson = json_encode($cardsData);
            $updateStmt->execute([':cards' => $newJson, ':id' => $deckId]);
            $updatedDecksCount++;
        }
    }

    // 画像ファイルのリネーム処理（もしあれば）
    $image_dir = dirname(__DIR__) . '/images';
    $old_img = $image_dir . '/' . $old_id . '.webp';
    $new_img = $image_dir . '/' . $new_id . '.webp';
    if (file_exists($old_img) && !file_exists($new_img)) {
        rename($old_img, $new_img);
    }

    $pdo->commit();
    echo json_encode([
        "status" => "success", 
        "message" => "Renamed $old_id to $new_id",
        "updated_decks" => $updatedDecksCount
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}