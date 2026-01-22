<?php

// api/data_sync.php
require 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];
header('Content-Type: application/json');

try {
    // --- GET: バックアップデータのダウンロード ---
    if ($method === 'GET') {
        // 全カード
        $stmt = $pdo->query("SELECT * FROM cards");
        $cards = $stmt->fetchAll();

        // 全デッキ
        $stmt = $pdo->query("SELECT * FROM decks");
        $decks = $stmt->fetchAll();

        // 構築済みJSONはDBから文字列で来るので、一度デコードしてから格納してもよいが、
        // そのまま出力するとエスケープが二重になる可能性があるため注意。
        // ここではPDOのFETCH_ASSOCのまま出すので、cardsカラムは「JSON文字列」の状態。
        // フロント側でパースして使う想定。

        $exportData = [
            'version' => 1,
            'exported_at' => date('Y-m-d H:i:s'),
            'cards' => $cards,
            'decks' => $decks
        ];

        echo json_encode($exportData);
    }

    // --- POST: データのインポート（復元） ---
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) throw new Exception("Invalid JSON");

        $pdo->beginTransaction();

        // 1. Cardsの同期
        if (isset($input['cards']) && is_array($input['cards'])) {
            $sql = "INSERT INTO cards (id, name, rarity, expansion_set, level, cost, color, type, text, zone, traits, link, ap, hp, image_url, updated_at)
                    VALUES (:id, :name, :rarity, :set, :lvl, :cost, :color, :type, :text, :zone, :traits, :link, :ap, :hp, :img, :updated)
                    ON DUPLICATE KEY UPDATE
                    name=VALUES(name), text=VALUES(text), updated_at=VALUES(updated_at)";
                    // 簡易化のため主要項目のみ更新。厳密にはupdated_at比較を入れるべきだが、
                    // 復元用途なら上書きで良いケースが多い。

            $stmt = $pdo->prepare($sql);
            foreach ($input['cards'] as $c) {
                $stmt->execute([
                    ':id' => $c['id'],
                    ':name' => $c['name'],
                    ':rarity' => $c['rarity'],
                    ':set' => $c['expansion_set'],
                    ':lvl' => $c['level'],
                    ':cost' => $c['cost'],
                    ':color' => $c['color'],
                    ':type' => $c['type'],
                    ':text' => $c['text'],
                    ':zone' => $c['zone'],
                    ':traits' => $c['traits'],
                    ':link' => $c['link'],
                    ':ap' => $c['ap'],
                    ':hp' => $c['hp'],
                    ':img' => $c['image_url'],
                    ':updated' => $c['updated_at'] ?? date('Y-m-d H:i:s')
                ]);
            }
        }

        // 2. Decksの同期
        if (isset($input['decks']) && is_array($input['decks'])) {
            $sql = "INSERT INTO decks (id, user_id, title, cards, thumbnail_id, created_at, updated_at)
                    VALUES (:id, :uid, :title, :cards, :thumb, :created, :updated)
                    ON DUPLICATE KEY UPDATE
                    title=VALUES(title), cards=VALUES(cards), updated_at=VALUES(updated_at)";

            $stmt = $pdo->prepare($sql);
            foreach ($input['decks'] as $d) {
                // cardsカラムが配列で来ている場合はJSON化、文字列ならそのまま
                $cardsVal = is_array($d['cards']) ? json_encode($d['cards']) : $d['cards'];

                $stmt->execute([
                    ':id' => $d['id'],
                    ':uid' => $d['user_id'],
                    ':title' => $d['title'],
                    ':cards' => $cardsVal,
                    ':thumb' => $d['thumbnail_id'],
                    ':created' => $d['created_at'] ?? date('Y-m-d H:i:s'),
                    ':updated' => $d['updated_at'] ?? date('Y-m-d H:i:s')
                ]);
            }
        }

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Import completed"]);
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
