# 提出課題

http://54.174.151.132/ にて課題を制作しました。

---

## 更新方法

### フロントエンド側
1. **権限を取得する**　Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
2. **ビルドする**　npm run build
3. **distディレクトリに移動する**　cd dist
4. **scpコマンドを実行する**　scp -i ..\documents\TCG_key.pem -r ./* ec2-user@54.174.151.132:/var/www/html/

### バックエンド側
1. **ec2にログインする**　ssh -i C:\Users\student\Desktop\GCG_app\documents\TCG_key.pem ec2-user@54.174.151.132
2. **assetsディレクトリに移動する**　cd /var/www/html/assets
3. **読取権限を付与する**　sudo chmod 755 .
