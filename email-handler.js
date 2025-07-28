// EmailJS初期化
(function() {
    emailjs.init("YOUR_PUBLIC_KEY"); // 後で設定
})();

// フォーム送信処理
function sendOrder(formData) {
    const templateParams = {
        customer_name: formData.get('lastName') + ' ' + formData.get('firstName'),
        customer_kana: formData.get('lastNameKana') + ' ' + formData.get('firstNameKana'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        zip_code: formData.get('zipCode'),
        prefecture: formData.get('prefecture'),
        city: formData.get('city'),
        address: formData.get('address'),
        product: document.querySelector('input[name="product"]:checked').value,
        message: formData.get('message') || '特になし',
        order_date: new Date().toLocaleString('ja-JP')
    };

    return emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
}

// 注文完了処理
function handleOrderSuccess() {
    // 成功ページへリダイレクト
    window.location.href = 'order-success.html';
}

// エラー処理
function handleOrderError(error) {
    console.error('注文送信エラー:', error);
    alert('申し訳ございません。送信に失敗しました。\nしばらく時間をおいて再度お試しください。');
}
