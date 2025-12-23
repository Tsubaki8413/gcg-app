<?php

// エラー表示設定
error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', 1);
set_time_limit(1800); 

// ブラウザ表示用
if (php_sapi_name() !== 'cli') {
    echo "<pre>";
}
// リアルタイム表示設定
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', 1);
}
@ini_set('zlib.output_compression', 0);
@ini_set('implicit_flush', 1);
for ($i = 0; $i < ob_get_level(); $i++) { ob_end_flush(); }
ob_implicit_flush(1);

// --- 設定エリア ---
$target_url_base = 'https://www.gundam-gcg.com/jp/cards/detail.php?detailSearch=';
$image_base_url = 'https://www.gundam-gcg.com/jp/';

// 保存フォルダ
if (!file_exists(__DIR__ . '/images')) {
    mkdir(__DIR__ . '/images', 0777, true);
}

// 取得範囲
$settings = [
    ['prefix' => 'ST01', 'count' => 30],
    ['prefix' => 'ST02', 'count' => 30],
    ['prefix' => 'ST03', 'count' => 30],
    ['prefix' => 'ST04', 'count' => 30],
    ['prefix' => 'ST05', 'count' => 30],
    ['prefix' => 'ST06', 'count' => 30],
    ['prefix' => 'GD01', 'count' => 150],
];

// ▼▼▼ XPath定義 ▼▼▼
$xpath_card_box = "//div[contains(@class, 'cardDetailPageContent')]";
$xpath_image_parent = ".//div[contains(@class, 'cardImage')]";
$xpath_stats = ".//*[contains(@class, 'dataTxt')]";
$xpath_name = ".//h1[contains(@class, 'cardName')]";
$xpath_id = ".//div[contains(@class, 'cardNo')]";
$xpath_rarity = ".//div[contains(@class, 'rarity')]";

// ▼▼▼ インデックス定義 ▼▼▼
$idx_level = 0; 
$idx_cost = 1; 
$idx_color = 2; 
$idx_type = 3;
$idx_text = 4; 
$idx_zone = 5; 
$idx_trait = 6; 
$idx_link = 7;
$idx_ap = 8; 
$idx_hp = 9; 
$idx_set = 11;

// cURL関数
function fetchData($url, $referer = 'https://www.gundam-gcg.com/') {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_COOKIEJAR, __DIR__ . '/cookie.txt');
    curl_setopt($ch, CURLOPT_COOKIEFILE, __DIR__ . '/cookie.txt');
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        "Referer: $referer",
        'Accept-Language: ja,en-US;q=0.9,en;q=0.8'
    ]);
    
    $data = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($data === false || $http_code >= 400) {
        return false;
    }
    return $data;
}

// 【重要】Excel用にデータを整形する関数
// 1. 改行コードを削除 (ズレ防止)
// 2. 文字コードをShift-JISに変換 (文字化け防止)
function cleanForExcel($text) {
    if ($text === null) return '';
    
    // 改行と余計な空白を削除
    $text = trim(preg_replace('/\s+/', ' ', $text));
    
    // Windows Excel用の文字コード(SJIS-win)に変換
    // 変換できない文字は ? に置き換える設定
    return mb_convert_encoding($text, 'SJIS-win', 'UTF-8');
}

echo "処理を開始します... (Excel最適化モード)\n";
flush();

// CSVを開く（Excelが開いていたらエラー停止）
$csv_path = __DIR__ . '/cards.csv';
$fp = @fopen($csv_path, 'w');
if ($fp === false) {
    die("エラー: Excelで '$csv_path' を開いている場合は閉じてから再実行してください。");
}

// ヘッダー書き込み（SJIS変換してから書き込む）
$header = [
    'id', 'name', 'rarity', 'expansion_set', 
    'level', 'cost', 'color', 'type', 
    'text', 'zone', 'traits', 'link', 
    'ap', 'hp', 'set_name', 'image_url'
];
// ヘッダーもSJIS変換
$header_sjis = array_map(function($v){ return mb_convert_encoding($v, 'SJIS-win', 'UTF-8'); }, $header);
fputcsv($fp, $header_sjis);

foreach ($settings as $set) {
    $prefix = $set['prefix'];
    $count = $set['count'];
    $miss_count = 0;

    echo "Setting: $prefix (Max $count)\n";
    flush();

    for ($i = 1; $i <= $count; $i++) {
        $id = $prefix . '-' . sprintf('%03d', $i);
        $url = $target_url_base . $id;

        echo "Fetching $id ... ";
        flush();

        $html = fetchData($url);
        $name = ''; 

        if ($html) {
            $dom = new DOMDocument;
            $html_utf8 = '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' . $html;
            @$dom->loadHTML($html_utf8);
            $xpath = new DOMXPath($dom);

            $nameNodes = $xpath->query($xpath_name);
            if ($nameNodes->length > 0) {
                // ここではまだUTF-8のまま扱う
                $name = trim($nameNodes->item(0)->textContent);
            }
        }

        if (empty($name) || $name === '該当するカードが見つかりません') {
            $miss_count++;
            echo "[Miss $miss_count/3] (Not Found)\n";
            flush();
            if ($miss_count >= 3) {
                echo "３回連続で見つからないため、次のセットへ移動します。\n";
                flush();
                break; 
            }
            continue;
        }

        $miss_count = 0;

        // --- データ取得 ---
        // ここではまだUTF-8で取得します
        $rarityNodes = $xpath->query($xpath_rarity);
        $rarity = ($rarityNodes->length > 0) ? trim($rarityNodes->item(0)->textContent) : '';

        $dataNodes = $xpath->query($xpath_stats);
        $getByIndex = function($idx) use ($dataNodes) {
            if ($dataNodes->length > $idx) {
                return trim($dataNodes->item($idx)->textContent);
            }
            return '';
        };

        // 配列にまとめる
        $row_data = [
            $id, 
            $name, 
            $rarity, 
            $prefix, 
            $getByIndex($idx_level),
            $getByIndex($idx_cost),
            $getByIndex($idx_color),
            $getByIndex($idx_type),
            $getByIndex($idx_text),
            $getByIndex($idx_zone),
            $getByIndex($idx_trait),
            $getByIndex($idx_link),
            $getByIndex($idx_ap),
            $getByIndex($idx_hp),
            $getByIndex($idx_set)
        ];

        // --- 画像処理 ---
        $imgNodes = $xpath->query($xpath_image_parent . "//img");
        $image_filename = '';

        if ($imgNodes->length > 0) {
            $raw_src = $imgNodes->item(0)->getAttribute('src');
            $clean_path = str_replace('../', '', $raw_src);
            $clean_path = strtok($clean_path, '?');
            $img_url = $image_base_url . $clean_path;

            // 画像DL済みチェック（時間短縮）
            $image_filename = $id . '.webp';
            if (file_exists(__DIR__ . '/images/' . $image_filename)) {
                echo "[Image Exists] ";
            } else {
                $img_data = fetchData($img_url, $url);
                if ($img_data) {
                    file_put_contents(__DIR__ . '/images/' . $image_filename, $img_data);
                    echo "[Image OK] ";
                } else {
                    echo "[Image Failed] ";
                    $image_filename = '';
                }
            }
        }
        $row_data[] = $image_filename;

        // 【ここがポイント】
        // CSVに書き込む直前に、配列の中身をすべて「改行削除」＆「Shift-JIS変換」する
        $row_sjis = array_map('cleanForExcel', $row_data);

        fputcsv($fp, $row_sjis);

        echo "Done ($name)\n";
        flush();

        usleep(300000); 
    }
}

fclose($fp);
echo "すべての処理が完了しました！Excelで開いて確認してください。";
if (php_sapi_name() !== 'cli') {
    echo "</pre>";
}