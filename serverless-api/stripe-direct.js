/**
 * Stripe直接決済処理 - Google Apps Scriptを使わない代替案
 * 
 * このファイルをHTMLから直接読み込んで使用します。
 * Google Apps Scriptを経由せずにStripe決済を処理します。
 */

// Stripe設定
const STRIPE_PUBLIC_KEY = 'pk_live_51RvKWh673l6kt5LxH6Tyz46zGR5KbC9JkWvD5UR0Tkt0Ofobap7qptE8OkPVLFo08KvqbcEwy4T1l96k3xAVaVaO00vqUtav39';

// Stripe初期化
const stripe = Stripe(STRIPE_PUBLIC_KEY);

// 注文データの保存と決済処理
async function processOrder(orderData) {
  try {
    console.log('注文処理を開始します...');
    
    // カード情報からStripeトークンを作成
    const cardElement = {
      number: orderData.cardNumber.replace(/\s/g, ''),
      exp_month: parseInt(orderData.cardExpiry.split('/')[0]),
      exp_year: parseInt('20' + orderData.cardExpiry.split('/')[1]),
      cvc: orderData.cardCVC
    };
    
    console.log('Stripe処理を開始します...');
    
    // Stripeトークン作成
    const result = await stripe.createToken({card: cardElement});
    
    if (result.error) {
      console.error('Stripeエラー:', result.error);
      throw new Error(result.error.message);
    }
    
    console.log('Stripeトークン作成成功:', result.token.id);
    
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
      stripeToken: result.token.id
    };
    
    // ローカルストレージに注文情報を保存（本番では適切なデータベースを使用）
    saveOrderToLocalStorage(orderInfo);
    
    // 注文確認メールの送信
    await sendConfirmationEmail(orderInfo);
    
    // 成功ページへリダイレクト
    return {
      success: true,
      orderId: 'ORD-' + Date.now(),
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

// 注文情報をローカルストレージに保存（デモ用）
function saveOrderToLocalStorage(orderInfo) {
  try {
    const orders = JSON.parse(localStorage.getItem('ropsyOrders') || '[]');
    orders.push({
      ...orderInfo,
      timestamp: Date.now()
    });
    localStorage.setItem('ropsyOrders', JSON.stringify(orders));
    console.log('注文情報をローカルストレージに保存しました');
  } catch (error) {
    console.error('ローカルストレージ保存エラー:', error);
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

// 注文フォームの送信イベントハンドラ
function setupOrderForm() {
  const orderForm = document.getElementById('orderForm');
  if (!orderForm) return;
  
  orderForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 入力チェック
    const requiredFields = ['lastName', 'firstName', 'email', 'phone', 'zipCode', 'address', 'cardNumber', 'cardExpiry', 'cardCVC'];
    const emptyFields = [];
    
    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (!field || !field.value.trim()) {
        const label = field?.previousElementSibling?.textContent || fieldId;
        emptyFields.push(label);
      }
    });
    
    if (emptyFields.length > 0) {
      alert(`以下の項目を入力してください：\n${emptyFields.join('\n')}`);
      return;
    }
    
    // ローディング表示
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('orderButton').style.display = 'none';
    
    try {
      // 選択された商品プランの取得
      const selectedProduct = document.querySelector('#productOptions .option-card.selected');
      if (!selectedProduct) {
        throw new Error('商品を選択してください');
      }
      
      // 注文データの準備
      const selectedFrequency = document.querySelector('#frequencyOptions .frequency-card.selected');
      const orderData = {
        lastName: document.getElementById('lastName').value,
        firstName: document.getElementById('firstName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        zipCode: document.getElementById('zipCode').value,
        address: document.getElementById('address').value,
        productName: selectedProduct.querySelector('div').textContent,
        productPlan: selectedProduct.dataset.plan,
        amount: parseInt(document.getElementById('orderSummaryContent').querySelector('.summary-row:last-child span:last-child').textContent.replace(/[¥,]/g, '')),
        frequency: selectedFrequency ? selectedFrequency.querySelector('div').textContent : '単品購入',
        deliveryDate: document.getElementById('firstDelivery').textContent,
        nextDelivery: selectedFrequency ? document.getElementById('nextDelivery').textContent : '',
        cardNumber: document.getElementById('cardNumber').value,
        cardExpiry: document.getElementById('cardExpiry').value,
        cardCVC: document.getElementById('cardCVC').value
      };
      
      // 注文処理
      const result = await processOrder(orderData);
      
      if (result.success) {
        // 成功ページへリダイレクト
        setTimeout(() => {
          window.location.href = result.redirectUrl;
        }, 2000);
      } else {
        throw new Error(result.error || '注文処理に失敗しました');
      }
      
    } catch (error) {
      console.error('注文エラー:', error);
      document.getElementById('loadingSection').style.display = 'none';
      document.getElementById('orderButton').style.display = 'block';
      
      // ユーザーフレンドリーなエラーメッセージ
      let errorMessage = 'エラーが発生しました。もう一度お試しください。';
      
      if (error.message.includes('card')) {
        errorMessage = 'クレジットカード情報に問題があります。カード番号、有効期限、セキュリティコードを確認してください。';
      } else if (error.message.includes('network')) {
        errorMessage = 'ネットワーク接続に問題があります。インターネット接続を確認してから再度お試しください。';
      }
      
      alert(errorMessage + '\n\n詳細: ' + error.message);
    }
  });
}

// DOMが読み込まれたら実行
document.addEventListener('DOMContentLoaded', function() {
  setupOrderForm();
  console.log('Stripe直接決済処理の準備完了');
}); 