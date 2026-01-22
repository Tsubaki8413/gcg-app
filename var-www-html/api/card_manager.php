<?php

// api/card_manager.php
require 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];
// 画像保存ディレクトリ (apiフォルダの1つ上のimages)
$image_dir = dirname(__DIR__) . '/images';

// 画像処理関数 (scrape.phpと同じロジック)
function saveUploadedImageAsWebP($tmpName, $savePath) {
    if (!file_exists($tmpName)) return false;
    $imgData = file_get_contents($tmpName);
    $srcImage = @imagecreatefromstring($imgData);
    if (!$srcImage) return false;

    $width = imagesx($srcImage);
    $height = imagesy($srcImage);
    $maxSide = 800;

    if ($width > $maxSide || $height > $maxSide) {
        if ($width >= $height) {
            $newWidth = $maxSide;
            $newHeight = floor($height * ($maxSide / $width));
        } else {
            $newHeight = $maxSide;
            $newWidth = floor($width * ($maxSide / $height));
        }
        $dstImage = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($dstImage, false);
        imagesavealpha($dstImage, true);
        imagecopyresampled($dstImage, $srcImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($srcImage);
        $srcImage = $dstImage;
    }

    $result = imagewebp($srcImage, $savePath, 80);
    imagedestroy($srcImage);
    return $result;
}

try {
    // --- POST: 新規登録 / 更新 ---
    if ($method === 'POST') {
        // FormDataで来るため $_POST と $_FILES を使用
        $id = strtoupper($_POST['id'] ?? '');
        $name = $_POST['name'] ?? '';

        if (empty($id) || empty($name)) {
            throw new Exception("ID and Name are required.");
        }

        // 画像処理
        $image_filename = null;
        // 既存の画像ファイル名を保持するか確認
        if (isset($_POST['existing_image']) && !empty($_POST['existing_image'])) {
            $image_filename = $_POST['existing_image'];
        }

        // 新しい画像がアップロードされた場合
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $ext = 'webp';
            $new_filename = $id . '.' . $ext;
            $save_path = $image_dir . '/' . $new_filename;

            if (saveUploadedImageAsWebP($_FILES['image']['tmp_name'], $save_path)) {
                $image_filename = $new_filename;
            } else {
                throw new Exception("Failed to process image.");
            }
        }

        // DB保存 (Upsert)
        $sql = "INSERT INTO cards (id, name, rarity, expansion_set, level, cost, color, type, text, zone, traits, link, ap, hp, image_url, updated_at)
                VALUES (:id, :name, :rarity, :set, :lvl, :cost, :color, :type, :text, :zone, :traits, :link, :ap, :hp, :img, NOW())
                ON DUPLICATE KEY UPDATE
                name=VALUES(name), rarity=VALUES(rarity), expansion_set=VALUES(expansion_set), level=VALUES(level),
                cost=VALUES(cost), color=VALUES(color), type=VALUES(type), text=VALUES(text), zone=VALUES(zone),
                traits=VALUES(traits), link=VALUES(link), ap=VALUES(ap), hp=VALUES(hp), image_url=VALUES(image_url), updated_at=NOW()";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':name' => $name,
            ':rarity' => $_POST['rarity'] ?? '',
            ':set' => $_POST['expansion_set'] ?? '',
            ':lvl' => (int)($_POST['level'] ?? 0),
            ':cost' => (int)($_POST['cost'] ?? 0),
            ':color' => $_POST['color'] ?? '',
            ':type' => $_POST['type'] ?? '',
            ':text' => $_POST['text'] ?? '',
            ':zone' => $_POST['zone'] ?? '',
            ':traits' => $_POST['traits'] ?? '',
            ':link' => $_POST['link'] ?? '',
            ':ap' => (int)($_POST['ap'] ?? 0),
            ':hp' => (int)($_POST['hp'] ?? 0),
            ':img' => $image_filename
        ]);

        echo json_encode(["status" => "success", "id" => $id]);
    }

    // --- DELETE: 削除 ---
    elseif ($method === 'DELETE') {
        // DELETEメソッドのパラメータはphp://inputからパースが必要な場合があるが、
        // 今回はURLクエリパラメータ (?id=xxx) で受け取る形にする
        $id = $_GET['id'] ?? '';
        if (empty($id)) throw new Exception("ID is required.");

        // 【重要】使用中チェック
        // decksテーブルのcardsカラム(JSON)を文字列として検索し、キーとして存在するか確認
        // JSON_SEARCH等はMySQLのバージョン依存があるため、確実な文字列検索を行う
        // 厳密には "ST01-001": というキーを探すべき
        $checkSql = "SELECT id, title FROM decks WHERE cards LIKE :pattern";
        $stmt = $pdo->prepare($checkSql);
        // JSON内のキー検索: "ID": というパターンを探す
        $stmt->execute([':pattern' => '%"' . $id . '":%']);
        $usedDecks = $stmt->fetchAll();

        if (count($usedDecks) > 0) {
            // 使用されているため削除禁止
            http_response_code(409); // Conflict
            echo json_encode([
                "error" => "Card is used in decks",
                "decks" => array_column($usedDecks, 'title')
            ]);
            exit;
        }

        // 削除実行
        $delStmt = $pdo->prepare("DELETE FROM cards WHERE id = :id");
        $delStmt->execute([':id' => $id]);

        // 画像も削除するかは運用次第だが、今回は残す（再登録時のため）か、
        // 完全に消すなら unlink($image_dir . '/' . $id . '.webp'); を追加

        echo json_encode(["status" => "deleted"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
