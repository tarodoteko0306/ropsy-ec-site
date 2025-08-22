// 本格的な決済システム - Google Apps Script
// このコードを手動でGoogle Apps Scriptにコピーしてください

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    console.log('Received request:', data.action);
    
    switch(data.action) {
      case 'createPaymentIntent':
        return createPaymentIntent(data.data);
      case 'confirmPayment':
        return confirmPayment(data.data);
      case 'saveOrder':
        return saveOrderToSheet(data.data);
      case 'sendConfirmationEmail':
        return sendConfirmationEmail(data.data);
      default:
        throw new Error('Invalid action: ' + data.action);
    }
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Stripe Payment Intent作成
function createPaymentIntent(orderData) {
  try {
    const amount = orderData.totalAmount;
    const currency = 'jpy';
    
    const payload = {
      'amount': amount,
      'currency': currency,
      'metadata': {
        'order_id': orderData.orderId,
        'customer_name': orderData.customerName,
        'customer_email': orderData.email,
        'product_plan': orderData.productPlan,
        'subscription_frequency': orderData.subscriptionFrequency || 'none'
      }
    };
    
    const options = {
      'method': 'POST',
      'headers': {
        'Authorization': 'Bearer ' + CONFIG.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      'payload': Object.keys(payload).map(key => {
        if (typeof payload[key] === 'object') {
          return Object.keys(payload[key]).map(subKey => 
            `${key}[${subKey}]=${encodeURIComponent(payload[key][subKey])}`
          ).join('&');
        }
        return `${key}=${encodeURIComponent(payload[key])}`;
      }).join('&')
    };
    
    const response = UrlFetchApp.fetch('https://api.stripe.com/v1/payment_intents', options);
    const paymentIntent = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() !== 200) {
      throw new Error('Stripe API Error: ' + paymentIntent.error.message);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 決済確認
function confirmPayment(paymentData) {
  try {
    const options = {
      'method': 'GET',
      'headers': {
        'Authorization': 'Bearer ' + CONFIG.STRIPE_SECRET_KEY
      }
    };
    
    const response = UrlFetchApp.fetch(
      `https://api.stripe.com/v1/payment_intents/${paymentData.payment_intent_id}`, 
      options
    );
    const paymentIntent = JSON.parse(response.getContentText());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        status: paymentIntent.status,
        payment_intent: paymentIntent
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error confirming payment:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 注文データをスプレッドシートに保存
function saveOrderToSheet(orderData) {
  try {
    const sheet = getOrCreateSheet();
    
    const rowData = [
      orderData.orderId,
      new Date(orderData.orderDate).toLocaleString('ja-JP'),
      orderData.lastName,
      orderData.firstName,
      orderData.email,
      orderData.phone,
      orderData.zipCode,
      orderData.address,
      orderData.productPlan,
      orderData.basePrice,
      orderData.finalPrice,
      orderData.shippingFee,
      orderData.totalAmount,
      orderData.subscriptionFrequency || '',
      Math.round((1 - orderData.discountRate) * 100) + '%',
      orderData.firstDeliveryDate,
      orderData.nextDeliveryDate || '',
      orderData.paymentStatus || '決済処理中',
      orderData.paymentIntentId || '',
      orderData.stripeCustomerId || '',
      new Date().toLocaleString('ja-JP') // 更新日時
    ];
    
    sheet.appendRow(rowData);
    sheet.autoResizeColumns(1, rowData.length);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Order saved successfully',
        orderId: orderData.orderId
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error saving order:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// スプレッドシート取得または作成
function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName('顧客管理');
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet('顧客管理');
    
    // ヘッダー行を設定
    const headers = [
      '注文ID', '注文日時', '姓', '名', 'メールアドレス', '電話番号',
      '郵便番号', '住所', '商品プラン', '基本価格', '最終価格', '送料',
      '合計金額', '定期購入頻度', '割引率', '初回配達予定日', '次回配達予定日',
      '決済状況', 'Payment Intent ID', 'Stripe Customer ID', '更新日時'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // ヘッダーのスタイル設定
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(10);
    
    // 列幅を自動調整
    sheet.autoResizeColumns(1, headers.length);
  }
  
  return sheet;
}

// 確認メール送信（EmailJS経由）
function sendConfirmationEmail(emailData) {
  try {
    // EmailJS APIを使用してメール送信
    const payload = {
      'service_id': CONFIG.EMAILJS_SERVICE_ID,
      'template_id': CONFIG.EMAILJS_TEMPLATE_ID,
      'user_id': CONFIG.EMAILJS_PUBLIC_KEY,
      'template_params': {
        'to_email': emailData.customerEmail,
        'customer_name': emailData.customerName,
        'order_id': emailData.orderId,
        'product_name': 'カリウムfor Beauty',
        'order_total': emailData.orderTotal,
        'delivery_date': emailData.deliveryDate,
        'subscription_info': emailData.subscriptionInfo || ''
      }
    };
    
    const options = {
      'method': 'POST',
      'headers': {
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify(payload)
    };
    
    const response = UrlFetchApp.fetch('https://api.emailjs.com/api/v1.0/email/send', options);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: response.getResponseCode() === 200,
        message: 'Email sent successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error sending email:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 定期的な次回配達日更新（トリガー設定用）
function updateNextDeliveryDates() {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return; // ヘッダーのみの場合
    
    const headers = data[0];
    const subscriptionIndex = headers.indexOf('定期購入頻度');
    const nextDeliveryIndex = headers.indexOf('次回配達予定日');
    const firstDeliveryIndex = headers.indexOf('初回配達予定日');
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const frequency = row[subscriptionIndex];
      const firstDelivery = row[firstDeliveryIndex];
      
      if (frequency && frequency !== '' && firstDelivery) {
        const nextDate = calculateNextDeliveryDate(firstDelivery, frequency);
        if (nextDate !== row[nextDeliveryIndex]) {
          sheet.getRange(i + 1, nextDeliveryIndex + 1).setValue(nextDate);
        }
      }
    }
    
    console.log('Next delivery dates updated');
    
  } catch (error) {
    console.error('Error updating delivery dates:', error);
  }
}

// 次回配達日計算
function calculateNextDeliveryDate(firstDeliveryStr, frequency) {
  try {
    const firstDate = new Date(firstDeliveryStr);
    const nextDate = new Date(firstDate);
    
    switch(frequency) {
      case 'monthly':
        nextDate.setMonth(firstDate.getMonth() + 1);
        break;
      case 'bimonthly':
        nextDate.setMonth(firstDate.getMonth() + 2);
        break;
      case 'quarterly':
        nextDate.setMonth(firstDate.getMonth() + 3);
        break;
      default:
        return '';
    }
    
    return nextDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
  } catch (error) {
    console.error('Error calculating next delivery date:', error);
    return '';
  }
}

// 日次トリガー設定
function setupDailyTrigger() {
  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateNextDeliveryDates') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // 新しいトリガーを作成
  ScriptApp.newTrigger('updateNextDeliveryDates')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
    
  console.log('Daily trigger created for updating delivery dates');
}
