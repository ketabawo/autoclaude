#!/bin/bash

# 環境変数を読み込み
source .env.local

echo "🚀 開始: SvelteKitアプリのビルドとデプロイ"

# ビルド
echo "📦 ビルド中..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ ビルドに失敗しました"
    exit 1
fi


echo "✅ ビルド完了"

# lftpがインストールされているかチェック
if ! command -v lftp &> /dev/null; then
    echo "❌ lftpがインストールされていません"
    echo "インストール: brew install lftp"
    exit 1
fi

# FTPアップロード
echo "📤 FTPアップロード中..."

lftp -c "
set ftp:ssl-allow no
open ftp://$FTP_USER:$FTP_PASS@$FTP_HOST
mirror -R --delete --verbose ./build/ $FTP_DIR
bye
"

if [ $? -eq 0 ]; then
    echo "✅ デプロイ完了！"
    echo "🌐 https://kanto.shisokai.info/"
else
    echo "❌ FTPアップロードに失敗しました"
    exit 1
fi