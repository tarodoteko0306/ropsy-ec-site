// Google Apps Script用の決済処理とスプレッドシート管理
const STRIPE_SECRET_KEY = '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';
const SPREADSHEET_ID = '1yfQzbzw5QHRvZt3CvLxukTjJtZJav3nshNaY4Fxl8z8';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    recordCustomerData(data);
    const paymentResult = processStripePayment(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        paymentIntent: paymentResult.id,
        clientSecret: paymentResult.client_secret
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function recordCustomerData(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 13).setValues([[
      '注文日時', '氏名', 'メール', '電話番号', '住所', '商品', '価格', 
      '配送頻度', '次回配送予定', '決済ID', 'ステータス', '備考', '郵便番号'
    ]]);
  }
  
  const rowData = [
    new Date(),
    data.customerName,
    data.email,
    data.phone,
    data.address,
    data.productName,
    data.amount,
    data.frequency || '単品',
    data.nextDelivery || '',
    data.paymentIntentId || '',
    '処理中',
    JSON.stringify(data),
    data.zipCode || ''
  ];
  
  sheet.appendRow(rowData);
}

function processStripePayment(data) {
  const payload = {
    amount: data.amount * 100,
    currency: 'jpy',
    payment_method_types: ['card'],
    metadata: {
      customer_name: data.customerName,
      product: data.productName,
      email: data.email
    }
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + STRIPE_SECRET_KEY,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    payload: Object.keys(payload).map(key => 
      key + '=' + encodeURIComponent(payload[key])
    ).join('&')
  };
  
  const response = UrlFetchApp.fetch('https://api.stripe.com/v1/payment_intents', options);
  return JSON.parse(response.getContentText());
}
