<?php

// api/deck_operations.php
require 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];
$user_id = '1'; // 個人利用のため固定

header('Content-Type: application/json');

try {
    // --- GET: デッキ一覧または詳細取得 ---
    if ($method === 'GET') {
        $deck_id = $_GET['id'] ?? null;

        if ($deck_id) {
            // 詳細取得
            $stmt = $pdo->prepare("SELECT * FROM decks WHERE id = :id");
            $stmt->execute([':id' => $deck_id]);
            $deck = $stmt->fetch();
            if ($deck) {
                echo json_encode($deck);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Deck not found"]);
            }
        } else {
            // 一覧取得 (更新日時順)
            $stmt = $pdo->prepare("SELECT id, title, thumbnail_id, updated_at FROM decks WHERE user_id = :uid ORDER BY updated_at DESC");
            $stmt->execute([':uid' => $user_id]);
            echo json_encode($stmt->fetchAll());
        }
    }

    // --- POST: 新規作成 または 更新 ---
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['title']) || !isset($input['cards'])) {
            throw new Exception("Missing required fields");
        }

        $id = $input['id'] ?? null; // IDがあれば更新、なければ新規
        $title = $input['title'];
        $cards_json = json_encode($input['cards']); // 配列をJSON文字列に変換
        $thumb = $input['thumbnail_id'] ?? null;

        if ($id) {
            // Update
            $sql = "UPDATE decks SET title=:title, cards=:cards, thumbnail_id=:thumb, updated_at=NOW() WHERE id=:id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':title'=>$title, ':cards'=>$cards_json, ':thumb'=>$thumb, ':id'=>$id]);
            echo json_encode(["status" => "updated", "id" => $id]);
        } else {
            // Insert (UUID生成)
            $new_id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );
            
            $sql = "INSERT INTO decks (id, user_id, title, cards, thumbnail_id) VALUES (:id, :uid, :title, :cards, :thumb)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id'=>$new_id, ':uid'=>$user_id, ':title'=>$title, ':cards'=>$cards_json, ':thumb'=>$thumb]);
            echo json_encode(["status" => "created", "id" => $new_id]);
        }
    }

    // --- DELETE: 削除 ---
    elseif ($method === 'DELETE') {
        $deck_id = $_GET['id'] ?? null;
        if (!$deck_id) throw new Exception("ID required");

        $stmt = $pdo->prepare("DELETE FROM decks WHERE id = :id");
        $stmt->execute([':id' => $deck_id]);
        echo json_encode(["status" => "deleted"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}