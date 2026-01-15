<?php

// エラー表示設定
error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', 1);
set_time_limit(1800); 

// GDライブラリのチェック（画像圧縮に必須）
if (!extension_loaded('gd')) {
    die("エラー: PHPのGDライブラリが有効になっていません。php.iniで extension=gd を有効にしてください。");
}

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

// 保存フォルダのパスを「一つ上の階層」に変更
$image_dir = dirname(__DIR__) . '/images';

// フォルダが存在しない場合は作成（権限777）
if (!file_exists($image_dir)) {
    // 再帰的作成はしないが、念のため
    if (!mkdir($image_dir, 0777, true)) {
        die("エラー: 画像保存用ディレクトリ '$image_dir' を作成できませんでした。権限を確認してください。");
    }
}

// 取得範囲
$settings = [
    ['prefix' => 'ST01', 'count' => 20],
    ['prefix' => 'ST02', 'count' => 20],
    ['prefix' => 'ST03', 'count' => 20],
    ['prefix' => 'ST04', 'count' => 20],
    ['prefix' => 'ST05', 'count' => 20],
    ['prefix' => 'ST06', 'count' => 20],
    ['prefix' => 'ST07', 'count' => 20],
    ['prefix' => 'ST08', 'count' => 20],
    ['prefix' => 'ST09', 'count' => 20],
    ['prefix' => 'ST10', 'count' => 20],

    ['prefix' => 'GD01', 'count' => 150],
    ['prefix' => 'GD02', 'count' => 150],
    ['prefix' => 'GD03', 'count' => 150],
    ['prefix' => 'GD04', 'count' => 150],
    ['prefix' => 'GD05', 'count' => 150],

    ['prefix' => 'T',    'count' => 50],
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

// 画像保存関数（リサイズ & WebP変換）
function saveAsWebP($imgData, $savePath) {
    if (empty($imgData)) return false;

    // 文字列から画像リソースを作成
    $srcImage = @imagecreatefromstring($imgData);
    if (!$srcImage) return false;

    $width = imagesx($srcImage);
    $height = imagesy($srcImage);
    
    // 長辺800px制限
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
        
        // 透過情報の維持
        imagealphablending($dstImage, false);
        imagesavealpha($dstImage, true);
        
        imagecopyresampled($dstImage, $srcImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($srcImage);
        $srcImage = $dstImage;
    }

    // WebPで保存
    $result = imagewebp($srcImage, $savePath, 80);
    imagedestroy($srcImage);
    
    return $result;
}

// Excel用にデータを整形する関数
function cleanForExcel($text) {
    if ($text === null) return '';
    // 前後の空白削除
    return trim($text);
}

// 【追加】DOM要素からHTMLを取得し、<br>を改行コードに変換してからテキスト化する関数
function getTextWithNewlines($node) {
    if (!$node) return '';

    // ノード内のHTMLを取得 (例: "攻撃時<br>1枚引く")
    $html = $node->ownerDocument->saveHTML($node);

    // <br>タグ (表記ゆれ含む) を \n に置換
    $html = preg_replace('/<br\s*\/?>/i', "\n", $html);

    // タグを除去して前後の空白を削除
    $text = trim(strip_tags($html));

    // 「。」の後に改行が続き、その後に「(」または「（」が来る場合、
    // 間の改行を強制的に「1つ」にします（空行を削除）。
    $text = preg_replace('/(。)\n+([\(（])/u', "$1\n$2", $text);

    return $text;
}

echo "処理を開始します...\n";
flush();

// CSVを開く
$csv_path = __DIR__ . '/cards.csv';
$fp = @fopen($csv_path, 'w');
if ($fp === false) {
    die("エラー: Excelで '$csv_path' を開いている場合は閉じてから再実行してください。");
}

// 【重要】Excelで文字化けしないための「BOM」を書き込む
fwrite($fp, "\xEF\xBB\xBF");

// ヘッダー書き込み（SJIS変換）
$header = [
    'id', 'name', 'rarity', 'expansion_set', 
    'level', 'cost', 'color', 'type', 
    'text', 'zone', 'traits', 'link', 
    'ap', 'hp', 'set_name', 'image_url'
];
fputcsv($fp, $header);

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
        $rarityNodes = $xpath->query($xpath_rarity);
        $rarity = ($rarityNodes->length > 0) ? trim($rarityNodes->item(0)->textContent) : '';

        $dataNodes = $xpath->query($xpath_stats);
        $getByIndex = function($idx) use ($dataNodes, $idx_text) {
            if ($dataNodes->length > $idx) {
                $node = $dataNodes->item($idx);
                
                // テキストの場合は、改行コード付きで取得する
                if ($idx === $idx_text) {
                    return getTextWithNewlines($node);
                }
                
                // それ以外は通常のテキスト取得
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

        // --- 画像処理 (WebP変換・リサイズ対応) ---
        $imgNodes = $xpath->query($xpath_image_parent . "//img");
        $image_filename = '';

        if ($imgNodes->length > 0) {
            $raw_src = $imgNodes->item(0)->getAttribute('src');
            $clean_path = str_replace('../', '', $raw_src);
            $clean_path = strtok($clean_path, '?');
            $img_url = $image_base_url . $clean_path;

            // ファイル名は .webp で統一
            $image_filename = $id . '.webp';
            // 保存先パス変数を $image_dir を使ったものに変更
            $save_path = $image_dir . '/' . $image_filename;

            if (file_exists($save_path)) {
                echo "[Image Exists] ";
            } else {
                $img_data = fetchData($img_url, $url);
                if ($img_data) {
                    // 【修正】saveAsWebP関数で保存
                    if (saveAsWebP($img_data, $save_path)) {
                        echo "[Image OK (WebP)] ";
                    } else {
                        echo "[Image Convert Error] ";
                        $image_filename = '';
                    }
                } else {
                    echo "[Image Download Failed] ";
                    $image_filename = '';
                }
            }
        }
        $row_data[] = $image_filename;

        // CSVに書き込む (改行削除 & SJIS変換)
        $row_formatted = array_map('cleanForExcel', $row_data);

        fputcsv($fp, $row_formatted);

        echo "Done ($name)\n";
        flush();

        usleep(300000); 
    }
}

fclose($fp);
echo "すべての処理が完了しました！Excelで開いて確認してください。\n";
if (php_sapi_name() !== 'cli') {
    echo "</pre>";
}