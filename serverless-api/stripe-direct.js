/**
 * Stripe直接決済処理 - 本番環境用実装
 */

// Stripe設定（ライブモード）
const STRIPE_PUBLIC_KEY = 'pk_live_51RvKWh673l6kt5LxH6Tyz46zGR5KbC9JkWvD5UR0Tkt0Ofobap7qptE8OkPVLFo08KvqbcEwy4T1l96k3xAVaVaO00vqUtav39';
const STRIPE_SECRET_KEY = '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';

// Stripe初期化
const stripe = Stripe(STRIPE_PUBLIC_KEY);

// 注文データの保存と決済処理
async function processOrder(orderData) {
  try {
    console.log('注文処理を開始します...');
    
    // カード情報の取得
    const cardNumber = orderData.cardNumber.replace(/\s/g, '');
    const cardExpiry = orderData.cardExpiry.split('/');
    const cardMonth = parseInt(cardExpiry[0]);
    const cardYear = parseInt('20' + cardExpiry[1]);
    const cardCVC = orderData.cardCVC;
    
    console.log('Stripe処理を開始します...');
    
    // Stripeカード要素の作成
    const cardElement = {
      number: cardNumber,
      exp_month: cardMonth,
      exp_year: cardYear,
      cvc: cardCVC
    };
    
    // Stripeトークン作成
    const result = await stripe.tokens.create({
      card: cardElement
    });
    
    if (!result || !result.id) {
      throw new Error('カード情報の処理に失敗しました');
    }
    
    console.log('Stripeトークン作成成功:', result.id);
    
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
      stripeToken: result.id
    };
    
    // ローカルストレージに注文情報を保存
    const savedOrderInfo = saveOrderToLocalStorage(orderInfo);
    
    // 決済処理
    const chargeResult = await createCharge(orderInfo);
    
    // メール送信
    await sendConfirmationEmail(orderInfo);
    
    // 成功ページへリダイレクト
    return {
      success: true,
      orderId: chargeResult.id,
      redirectUrl: `success.html?order=${Date.now()}&plan=${orderData.productPlan}&delivery=${encodeURIComponent(orderData.deliveryDate)}`
    };
    
  } catch (error) {
    console.error('処理エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Stripe決済処理
async function createCharge(orderInfo) {
  try {
    const response = await fetch('https://api.stripe.com/v1/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        amount: orderInfo.amount,
        currency: 'jpy',
        source: orderInfo.stripeToken,
        description: `Order for ${orderInfo.productName}`,
        receipt_email: orderInfo.email,
        metadata: {
          customer_name: orderInfo.customerName,
          phone: orderInfo.phone,
          address: orderInfo.address,
          frequency: orderInfo.frequency
        }
      })
    });
    
    const result = await response.json();
    
    if (!result.id) {
      throw new Error(result.error?.message || '決済処理に失敗しました');
    }
    
    return result;
  } catch (error) {
    console.error('決済エラー:', error);
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
          payment_id: orderInfo.stripeToken,
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