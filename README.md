# 提出課題

## 起動方法
本システムは、バックエンドがAWS（EC2）、フロントエンドがローカルPC（Windows）で動作するハイブリッド構成である。 開発時は**3つのターミナル（PowerShell等）**を開き、以下の手順でSSHトンネルを確立して接続する。画面はすべて閉じない。

**バックエンド起動（AWS側）**
1. ssh接続　ssh -i C:\Users\student\Desktop\GCG_app\documents\TCG_key.pem ec2-user@54.174.151.132
2. ディレクトリ移動　cd /var/www/html
3. PHPサーバー起動　php -S 0.0.0.0:8080

**SSHトンネル接続（ローカル側）**
1. ssh接続　ssh -i C:\Users\student\Desktop\GCG_app\documents\TCG_key.pem **-L 8080:localhost:8080** ec2-user@54.174.151.132

**フロントエンド起動（ローカル側）**
1. 権限関連　Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
2. インストール　npm install react-router-dom react-virtuoso html2canvas recharts framer-motion clsx tailwind-merge
3. 起動　npm run dev