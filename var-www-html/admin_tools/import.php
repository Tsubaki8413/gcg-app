<?php

// エラー表示設定
ini_set('display_errors', 1);
error_reporting(E_ALL);

// ▼▼▼ 設定エリア（ここを書き換えてください） ▼▼▼
$db_host = 'localhost';
$db_name = 'gcg_app';
$db_user = 'gcg_user';
$db_password = 'password123'; // ←ここを変更！
$csv_file = __DIR__ . '/cards.csv';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

try {
    // データベース接続
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if (!file_exists($csv_file)) {
        die("エラー: CSVファイルが見つかりません: $csv_file");
    }
    $fp = fopen($csv_file, 'r');

    $pdo->beginTransaction();
    echo "インポートを開始します...\n";
    $count = 0;

    // ヘッダー行スキップ
    fgetcsv($fp, 0, ",", "\"", "\\");

    // 【修正】カラム名を setup.sql に合わせて 'link' に変更
    $sql = "INSERT INTO cards
            (id, name, rarity, expansion_set, level, cost, color, type, text, zone, traits, link, ap, hp, image_url)
            VALUES
            (:id, :name, :rarity, :expansion_set, :level, :cost, :color, :type, :text, :zone, :traits, :link, :ap, :hp, :image_url)
            ON DUPLICATE KEY UPDATE
            name = VALUES(name), text = VALUES(text), updated_at = NOW()";

    $stmt = $pdo->prepare($sql);

    // 読み込みループ
    while (($data = fgetcsv($fp, 0, ",", "\"", "\\")) !== false) {

        // CSVの文字コード(SJIS)からUTF-8へ変換
        $convert = function($val) {
            // 文字列以外はそのまま返す
            if (!is_string($val)) return $val;
            // 既にUTF-8っぽいならそのまま（二重変換防止）、そうでなければ変換
            if (mb_detect_encoding($val, ['UTF-8', 'SJIS-win'], true) === 'UTF-8') {
                return $val;
            }
            return mb_convert_encoding($val, 'UTF-8', 'SJIS-win');
        };

        if (count($data) < 15) continue;

        $params = [
            ':id'            => $convert($data[0]),
            ':name'          => $convert($data[1]),
            ':rarity'        => $convert($data[2]),
            ':expansion_set' => $convert($data[3]),
            ':level'         => (int)$data[4],
            ':cost'          => (int)$data[5],
            ':color'         => $convert($data[6]),
            ':type'          => $convert($data[7]),
            ':text'          => $convert($data[8]),
            ':zone'          => $convert($data[9]),
            ':traits'        => $convert($data[10]),
            ':link'          => $convert($data[11]), // ここは元のままでOK(CSVの11番目がlink)
            ':ap'            => (int)$data[12],
            ':hp'            => (int)$data[13],
            ':image_url'     => $convert($data[15] ?? ''),
        ];

        $stmt->execute($params);
        $count++;

        if ($count % 50 === 0) echo "$count 件処理中...\n";
    }

    $pdo->commit();
    fclose($fp);
    echo "完了！合計 $count 件のデータを登録しました。\n";

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "エラーが発生しました: " . $e->getMessage() . "\n";
}