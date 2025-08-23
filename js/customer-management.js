/**
 * 顧客情報管理システム
 */

// 顧客データの保存
function saveCustomerData(customerData) {
  try {
    // ローカルストレージから既存のデータを取得
    const customers = JSON.parse(localStorage.getItem('ropsyCustomers') || '[]');
    
    // 既存の顧客かどうかチェック
    const existingCustomerIndex = customers.findIndex(c => c.email === customerData.email);
    
    if (existingCustomerIndex >= 0) {
      // 既存の顧客情報を更新
      customers[existingCustomerIndex] = {
        ...customers[existingCustomerIndex],
        ...customerData,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // 新規顧客を追加
      customers.push({
        ...customerData,
        customerId: 'CUST-' + Date.now(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
    
    // ローカルストレージに保存
    localStorage.setItem('ropsyCustomers', JSON.stringify(customers));
    console.log('顧客情報を保存しました:', customerData.email);
    return true;
  } catch (error) {
    console.error('顧客情報の保存に失敗しました:', error);
    return false;
  }
}

// 顧客データの取得
function getCustomerData(email) {
  try {
    const customers = JSON.parse(localStorage.getItem('ropsyCustomers') || '[]');
    return customers.find(c => c.email === email) || null;
  } catch (error) {
    console.error('顧客情報の取得に失敗しました:', error);
    return null;
  }
}

// すべての顧客データを取得
function getAllCustomers() {
  try {
    return JSON.parse(localStorage.getItem('ropsyCustomers') || '[]');
  } catch (error) {
    console.error('顧客情報の取得に失敗しました:', error);
    return [];
  }
}

// 注文情報と顧客情報を関連付け
function linkOrderToCustomer(orderInfo) {
  if (!orderInfo || !orderInfo.email) return false;
  
  try {
    // 顧客情報を取得または作成
    const customerData = {
      firstName: orderInfo.customerName.split(' ')[1] || '',
      lastName: orderInfo.customerName.split(' ')[0] || '',
      email: orderInfo.email,
      phone: orderInfo.phone || '',
      address: orderInfo.address || '',
      zipCode: orderInfo.zipCode || ''
    };
    
    // 顧客情報を保存
    saveCustomerData(customerData);
    
    // 注文履歴を更新
    const orderHistory = JSON.parse(localStorage.getItem(`orderHistory_${orderInfo.email}`) || '[]');
    orderHistory.push({
      orderId: orderInfo.orderId || 'ORD-' + Date.now(),
      productName: orderInfo.productName,
      amount: orderInfo.amount,
      orderDate: orderInfo.orderDate,
      status: 'completed'
    });
    
    localStorage.setItem(`orderHistory_${orderInfo.email}`, JSON.stringify(orderHistory));
    return true;
  } catch (error) {
    console.error('注文と顧客の関連付けに失敗しました:', error);
    return false;
  }
}

// 顧客の注文履歴を取得
function getCustomerOrderHistory(email) {
  if (!email) return [];
  
  try {
    return JSON.parse(localStorage.getItem(`orderHistory_${email}`) || '[]');
  } catch (error) {
    console.error('注文履歴の取得に失敗しました:', error);
    return [];
  }
}

// 顧客管理モジュールをエクスポート
window.CustomerManagement = {
  saveCustomerData,
  getCustomerData,
  getAllCustomers,
  linkOrderToCustomer,
  getCustomerOrderHistory
}; 