// Google Apps Script用の決済処理とスプレッドシート管理
const STRIPE_SECRET_KEY = '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';
const SPREADSHEET_ID = '1yfQzbzw5QHRvZt3CvLxukTjJtZJav3nshNaY4Fxl8z8';

// 設定オブジェクト（CONFIG参照エラー対策）
const CONFIG = {
  STRIPE_SECRET_KEY: STRIPE_SECRET_KEY,
  SPREADSHEET_ID: SPREADSHEET_ID
};

// 注: doPost関数はcors_helpers.gsに移動しました

function recordCustomerData(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 14).setValues([[
      '注文日時', '氏名', 'メール', '電話番号', '住所', '商品', '価格', 
      '配送頻度', '次回配送予定', '決済ID', 'ステータス', '備考', '郵便番号', 'Stripeトークン'
    ]]);
  }
  
  const rowData = [
    new Date(),
    data.customerName || '不明',
    data.email || '不明',
    data.phone || '不明',
    data.address || '不明',
    data.productName || '不明',
    data.amount || 0,
    data.frequency || '単品',
    data.nextDelivery || '',
    data.paymentIntentId || data.stripeToken || '',
    data.stripeToken ? '決済処理中' : '注文受付',
    JSON.stringify(data).substring(0, 1000), // 長すぎる場合は切り詰め
    data.zipCode || '',
    data.stripeToken || ''
  ];
  
  sheet.appendRow(rowData);
  console.log('データ記録完了: ' + data.customerName);
}

function processStripePayment(data) {
  try {
    const payload = {
      amount: data.amount,
      currency: 'jpy',
      source: data.stripeToken,
      description: `Order from ${data.customerName} for ${data.productName}`,
      metadata: {
        customer_name: data.customerName || '不明',
        product: data.productName || '不明',
        email: data.email || '不明'
      }
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payload: Object.keys(payload).map(key => {
        if (typeof payload[key] === 'object') {
          return Object.keys(payload[key]).map(subKey => 
            `${key}[${subKey}]=${encodeURIComponent(payload[key][subKey])}`
          ).join('&');
        }
        return `${key}=${encodeURIComponent(payload[key])}`;
      }).join('&'),
      muteHttpExceptions: true // エラーを捕捉するため
    };
    
    console.log('Stripe API呼び出し開始...');
    const response = UrlFetchApp.fetch('https://api.stripe.com/v1/charges', options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('Stripe API応答コード:', responseCode);
    
    if (responseCode !== 200) {
      console.error('Stripe APIエラー:', responseText);
      throw new Error('Stripe API Error: ' + responseText);
    }
    
    const result = JSON.parse(responseText);
    
    // 成功した場合はスプレッドシートのステータスを更新
    try {
      updatePaymentStatus(data.email, result.id, 'success');
    } catch (updateError) {
      console.error('ステータス更新エラー:', updateError);
      // 更新エラーは無視して処理を続行
    }
    
    return result;
  } catch (error) {
    console.error('決済処理中のエラー:', error);
    throw error; // 上位関数でキャッチするためにエラーを再スロー
  }
}

// 支払いステータスの更新
function updatePaymentStatus(email, paymentId, status) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const emailColumn = 2; // メールアドレスの列（0から始まる）
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailColumn] === email) {
      // 決済IDとステータスを更新
      sheet.getRange(i + 1, 10).setValue(paymentId); // 決済ID列
      sheet.getRange(i + 1, 11).setValue(status === 'success' ? '決済完了' : 'エラー'); // ステータス列
      console.log('ステータス更新完了:', email, paymentId, status);
      break;
    }
  }
}
