// 価格修正用のJavaScript（order.htmlに組み込まれます）

// 正しい価格設定
const CORRECT_PRICES = {
    single: {
        basePrice: 1600,
        shipping: 500,
        totalPrice: 2100,
        discount: 0,
        title: "単品購入"
    },
    double: {
        basePrice: 2880,
        shipping: 0,
        totalPrice: 2880,
        discount: 10,
        title: "2個セット",
        originalPrice: 3200
    },
    triple: {
        basePrice: 4080,
        shipping: 0,
        totalPrice: 4080,
        discount: 15,
        title: "3個セット", 
        originalPrice: 4800
    }
};
