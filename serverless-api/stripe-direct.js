/**
 * Stripe直接決済処理 - 本番環境用実装
 */

// Stripe設定（ライブモード）
const STRIPE_PUBLIC_KEY = 'pk_live_51RvKWh673l6kt5LxH6Tyz46zGR5KbC9JkWvD5UR0Tkt0Ofobap7qptE8OkPVLFo08KvqbcEwy4T1l96k3xAVaVaO00vqUtav39';

// Stripe初期化
const stripe = Stripe(STRIPE_PUBLIC_KEY);

// Google Apps Scriptエンドポイント
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx6c1osjZpwtW2FZb6VoL1Cs5MyhWl-iXjJfbQfET6c7IQkv9ha-NJPpj531Cez5APS9g/exec';

// 注文データの保存と決済処理
async function processOrder(orderData) {
  try {
    console.log('注文処理を開始します...');
    
    // 注文情報の作成
    const orderInfo = {
      customerName: orderData.lastName + ' ' + orderData.firstName,
      email: orderData.email,
      phone: orderData.phone,
      zipCode: orderData.zipCode,
      address: orderData.address,
      productName: orderData.productName,
      amount: orderData.amount,
      frequency: orderData.frequency || '単品購入',
      deliveryDate: orderData.deliveryDate,
      nextDelivery: orderData.nextDelivery || '',
      orderDate: new Date().toLocaleString('ja-JP'),
      orderId: 'ORD-' + Date.now()
    };
    
    // ローカルストレージに注文情報を保存
    saveOrderToLocalStorage(orderInfo);
    
    // Google Apps Scriptに注文情報を送信
    const saveResult = await saveOrderToServer(orderInfo);
    
    if (saveResult.success) {
      // メール送信
      await sendConfirmationEmail(orderInfo);
      
      // 成功ページへリダイレクト
      return {
        success: true,
        orderId: orderInfo.orderId,
        redirectUrl: `success.html?order=${orderInfo.orderId}&plan=${encodeURIComponent(orderData.productName)}&delivery=${encodeURIComponent(orderData.deliveryDate)}`
      };
    } else {
      throw new Error(saveResult.error || '注文処理に失敗しました');
    }
    
  } catch (error) {
    console.error('処理エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Google Apps Scriptに注文情報を送信
async function saveOrderToServer(orderInfo) {
  try {
    const response = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'saveOrder',
        orderId: orderInfo.orderId,
        customerName: orderInfo.customerName,
        email: orderInfo.email,
        phone: orderInfo.phone,
        address: orderInfo.address,
        productName: orderInfo.productName,
        amount: orderInfo.amount,
        frequency: orderInfo.frequency,
        deliveryDate: orderInfo.deliveryDate
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'サーバーとの通信に失敗しました');
    }
    
    return result;
    
  } catch (error) {
    console.error('サーバー通信エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 注文情報をローカルストレージに保存
function saveOrderToLocalStorage(orderInfo) {
  try {
    const orders = JSON.parse(localStorage.getItem('ropsyOrders') || '[]');
    const orderWithId = {
      ...orderInfo,
      orderId: 'ORD-' + Date.now(),
      timestamp: Date.now(),
      status: 'completed'
    };
    orders.push(orderWithId);
    localStorage.setItem('ropsyOrders', JSON.stringify(orders));
    console.log('注文情報をローカルストレージに保存しました');
    
    // 顧客管理システムと連携
    if (window.CustomerManagement) {
      window.CustomerManagement.linkOrderToCustomer(orderWithId);
    }
    
    return orderWithId;
  } catch (error) {
    console.error('ローカルストレージ保存エラー:', error);
    return orderInfo;
  }
}

// メール送信処理
async function sendConfirmationEmail(orderInfo) {
  try {
    // EmailJS設定
    const emailjsConfig = {
      serviceId: 'service_l3e47bc',
      templateId: 'template_bzk9mpf',
      publicKey: 'bJTa6D-K4-MainZRn'
    };
    
    // EmailJSが初期化されていることを確認
    if (typeof emailjs !== 'undefined') {
      await emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        {
          to_name: orderInfo.customerName.split(' ')[1],
          email: orderInfo.email,
          customer_name: orderInfo.customerName,
          product_name: orderInfo.productName,
          amount: typeof orderInfo.amount === 'number' ? orderInfo.amount.toLocaleString() : orderInfo.amount,
          frequency: orderInfo.frequency,
          delivery_date: orderInfo.deliveryDate,
          payment_id: orderInfo.orderId,
          order_date: orderInfo.orderDate,
          address: orderInfo.address
        }
      );
      console.log('メール送信成功');
    } else {
      console.warn('EmailJSが読み込まれていません');
    }
  } catch (error) {
    console.error('メール送信エラー:', error);
    // メール送信エラーは無視して処理を続行
  }
}

// DOMが読み込まれたら実行
document.addEventListener('DOMContentLoaded', function() {
  console.log('Stripe直接決済処理の準備完了');
}); 