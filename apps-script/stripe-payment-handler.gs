/**
 * Stripe決済処理用Google Apps Script
 * 本番環境でのStripe決済を処理します
 */

// Stripe設定
const STRIPE_SECRET_KEY = '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';
const SPREADSHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'; // 実際のスプレッドシートIDに変更してください

// CORS設定
const ALLOW_ORIGIN = 'https://andropsy-official.com';
const ALLOW_HEADERS = 'Content-Type, Authorization';
const ALLOW_METHODS = 'POST, GET, OPTIONS';

function _corsOk_(body) {
  const out = ContentService.createTextOutput(body || '');
  out.setMimeType(ContentService.MimeType.JSON);
  out.addHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  out.addHeader('Access-Control-Allow-Methods', ALLOW_METHODS);
  out.addHeader('Access-Control-Allow-Headers', ALLOW_HEADERS);
  return out;
}

function doOptions(e) { 
  return _corsOk_(''); 
}

function doPost(e) {
  try {
    const result = mainPostHandler(e);
    return _corsOk_(typeof result === 'string' ? result : JSON.stringify(result));
  } catch (error) {
    console.error('エラー:', error);
    return _corsOk_(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

function doGet(e) { 
  return _corsOk_(JSON.stringify({ok: true})); 
}

function mainPostHandler(e) {
  const data = JSON.parse(e.postData.contents);
  
  switch (data.action) {
    case 'createPaymentIntent':
      return createPaymentIntent(data);
    case 'confirmPayment':
      return confirmPayment(data);
    case 'saveOrder':
      return saveOrder(data);
    default:
      return { success: false, error: 'Unknown action' };
  }
}

// Payment Intent作成
function createPaymentIntent(data) {
  try {
    const url = 'https://api.stripe.com/v1/payment_intents';
    const payload = {
      amount: data.amount,
      currency: 'jpy',
      metadata: {
        customer_name: data.customerName,
        customer_email: data.email,
        product_name: data.productName,
        order_id: data.orderId
      }
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payload: payload
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return {
      success: true,
      clientSecret: result.client_secret,
      paymentIntentId: result.id
    };
    
  } catch (error) {
    console.error('Payment Intent作成エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 決済確認
function confirmPayment(data) {
  try {
    const url = `https://api.stripe.com/v1/payment_intents/${data.paymentIntentId}/confirm`;
    const payload = {
      payment_method: data.paymentMethodId
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payload: payload
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return {
      success: true,
      paymentIntent: result
    };
    
  } catch (error) {
    console.error('決済確認エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 注文情報をスプレッドシートに保存
function saveOrder(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    
    const orderData = [
      new Date(),
      data.orderId,
      data.customerName,
      data.email,
      data.phone,
      data.address,
      data.productName,
      data.amount,
      data.frequency,
      data.deliveryDate,
      data.paymentIntentId || '',
      'completed'
    ];
    
    sheet.appendRow(orderData);
    
    return {
      success: true,
      message: '注文情報を保存しました'
    };
    
  } catch (error) {
    console.error('注文保存エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
} 