/**
 * Stripe直接決済処理 - 本番環境用実装
 */

// Stripe設定（ライブモード）
const STRIPE_PUBLIC_KEY = 'pk_live_51RvKWh673l6kt5LxH6Tyz46zGR5KbC9JkWvD5UR0Tkt0Ofobap7qptE8OkPVLFo08KvqbcEwy4T1l96k3xAVaVaO00vqUtav39';

// Stripe初期化
const stripe = Stripe(STRIPE_PUBLIC_KEY);

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
    
    // Stripe Checkoutセッションを作成
    const session = await createCheckoutSession(orderInfo);
    
    // Stripe Checkoutにリダイレクト
    const result = await stripe.redirectToCheckout({
      sessionId: session.id
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return {
      success: true,
      sessionId: session.id
    };
    
  } catch (error) {
    console.error('処理エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Stripe Checkoutセッション作成
async function createCheckoutSession(orderInfo) {
  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        payment_method_types: 'card',
        line_items: JSON.stringify([{
          price_data: {
            currency: 'jpy',
            product_data: {
              name: orderInfo.productName,
              description: `${orderInfo.frequency} - ${orderInfo.deliveryDate}`
            },
            unit_amount: orderInfo.amount
          },
          quantity: 1
        }]),
        mode: 'payment',
        success_url: `${window.location.origin}/success.html?order=${orderInfo.orderId}&plan=${encodeURIComponent(orderInfo.productName)}&delivery=${encodeURIComponent(orderInfo.deliveryDate)}`,
        cancel_url: `${window.location.origin}/order.html`,
        customer_email: orderInfo.email,
        metadata: {
          customer_name: orderInfo.customerName,
          phone: orderInfo.phone,
          address: orderInfo.address,
          zip_code: orderInfo.zipCode,
          frequency: orderInfo.frequency,
          order_id: orderInfo.orderId
        }
      })
    });
    
    const session = await response.json();
    
    if (!session.id) {
      throw new Error(session.error?.message || 'Checkoutセッションの作成に失敗しました');
    }
    
    return session;
  } catch (error) {
    console.error('Checkoutセッション作成エラー:', error);
    throw error;
  }
}

// 注文情報をローカルストレージに保存
function saveOrderToLocalStorage(orderInfo) {
  try {
    const orders = JSON.parse(localStorage.getItem('ropsyOrders') || '[]');
    const orderWithId = {
      ...orderInfo,
      orderId: 'ORD-' + Date.now(),
      timestamp: Date.now()
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