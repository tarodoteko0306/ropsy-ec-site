# ROPSY ECサイト

カリウムfor Beautyの公式ECサイト

## 機能
- 商品紹介ページ
- 実際のStripe決済機能
- Google Spreadsheet顧客管理
- 自動メール送信
- レスポンシブデザイン

## 価格設定
- 単品: ¥1,600 + 送料¥500 = ¥2,100
- 2個セット: ¥2,880（送料無料・10%OFF）  
- 3個セット: ¥4,080（送料無料・15%OFF）

## 定期購入割引
- 毎月: 25%OFF
- 2ヶ月毎: 20%OFF
- 3ヶ月毎: 15%OFF

## セットアップ

### Google Apps Script設定
1. https://script.google.com で新プロジェクト作成
2. server-payment-handler.gs の内容をコピー
3. デプロイしてWebアプリURLを取得
4. js/config.js のwebhookEndpointを更新

### EmailJS設定
1. https://www.emailjs.com でアカウント作成
2. js/config.js のEMAIL_CONFIGを更新
