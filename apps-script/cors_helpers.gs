// ===== CORS helpers (add to your GAS project and redeploy Web App) =====
const ALLOW_ORIGIN = 'https://andropsy-official.com';  // 正確なドメインを指定
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

// 既存のdoPost関数をラップする
function doPost(e) {
  const result = mainPostHandler(e);
  return _corsOk_(typeof result === 'string' ? result : JSON.stringify(result));
}

// 既存のdoGet関数をラップする
function doGet(e) {
  return _corsOk_(JSON.stringify({ok: true}));
}

// メインの処理ハンドラ - 既存のdoPost関数の内容をここに移動
function mainPostHandler(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    recordCustomerData(data);
    
    // Stripeトークンが存在する場合は決済処理を行う
    if (data.stripeToken) {
      const paymentResult = processStripePayment(data);
      
      return {
        success: true,
        paymentIntent: paymentResult.id,
        clientSecret: paymentResult.client_secret || '',
        status: paymentResult.status || 'succeeded'
      };
    } else {
      // トークンがない場合は単純に成功を返す
      return {
        success: true,
        message: 'Order recorded successfully'
      };
    }
      
  } catch (error) {
    console.error('Error:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}
