// ROPSY ECサイト設定
window.ROPSY_CONFIG = {
    // Stripe設定（テストキー）
    stripe: {
        publishableKey: 'pk_test_51RvKWh673l6kt5LxMbqybBzwob98vno1yBNYcZxqEL6xxz0gJJCHwOPGa4FLfW7ICaCgqNvqvUjUBLISkDXGK6CA007vAI7Uuw'
    },
    
    // Google Apps Script API エンドポイント（新URL）
    api: {
        endpoint: 'https://script.google.com/macros/s/AKfycbzBzgRDpNB6m9bJ4yqiSoMPZIMflsOUyW9RwSKn2SRreX_QkvVodaJ2kuPe-aF_TVae/exec'
    },
    
    // EmailJS設定
    emailjs: {
        serviceId: 'service_l3e47bc',
        templateId: 'template_bzk9mpf',
        publicKey: 'bJTa6D-K4-MainZRn'
    },
    
    // 商品設定
    products: {
        single: {
            price: 1600,
            shipping: 500,
            total: 2100
        },
        double: {
            price: 2880,
            shipping: 0,
            total: 2880
        },
        triple: {
            price: 4080,
            shipping: 0,
            total: 4080
        }
    },
    
    // 定期購入割引率
    subscriptionDiscounts: {
        monthly: 0.25,    // 25%OFF
        bimonthly: 0.20,  // 20%OFF
        quarterly: 0.15   // 15%OFF
    }
};
