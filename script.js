// スムーススクロール機能
document.addEventListener('DOMContentLoaded', function() {
    // ヘッダーのキャンペーンボタンのスムーススクロール
    const headerBtn = document.querySelector('.header-btn');
    if (headerBtn) {
        headerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector('#campaign');
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }

    // ヒーローセクションのCTAボタンのスムーススクロール
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function(e) {
            // 外部リンクの場合はそのまま遷移
            if (this.getAttribute('href').startsWith('http')) {
                return true;
            }
        });
    }

    // スクロール時のヘッダー背景変更
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = '#fff';
            header.style.backdropFilter = 'none';
        }
    });

    // 要素がビューポートに入った時のアニメーション
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // アニメーション対象要素を監視
    const animateElements = document.querySelectorAll('.stage-block, .testimonial, .why-not-item, .quality-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });

    // カウントアップアニメーション
    function animateCounter(element, target, suffix = '') {
        let current = 0;
        const increment = target / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString() + suffix;
        }, 20);
    }

    // 数字要素のカウントアップ
    const numberObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const text = element.textContent;
                
                if (text.includes('1,320')) {
                    animateCounter(element, 1320, 'mg');
                } else if (text.includes('15')) {
                    animateCounter(element, 15, '種');
                } else if (text.includes('121')) {
                    animateCounter(element, 121, '種');
                }
                
                numberObserver.unobserve(element);
            }
        });
    }, { threshold: 0.5 });

    const numberElements = document.querySelectorAll('.amount-highlight, .number');
    numberElements.forEach(el => {
        numberObserver.observe(el);
    });

    // モバイルメニュー（必要に応じて）
    const createMobileMenu = () => {
        const header = document.querySelector('.header');
        const container = header.querySelector('.container');
        
        // モバイル表示時の調整
        if (window.innerWidth <= 768) {
            container.style.flexDirection = 'column';
            container.style.gap = '15px';
        } else {
            container.style.flexDirection = 'row';
            container.style.gap = '0';
        }
    };

    // ウィンドウリサイズ時の対応
    window.addEventListener('resize', createMobileMenu);
    createMobileMenu();

    // 価格表示のアニメーション
    const priceElements = document.querySelectorAll('.price-amount');
    const priceObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'priceGlow 2s ease-in-out infinite alternate';
            }
        });
    }, { threshold: 0.8 });

    priceElements.forEach(el => {
        priceObserver.observe(el);
    });

    // お客様の声のローテーション効果（オプション）
    const testimonials = document.querySelectorAll('.testimonial');
    testimonials.forEach((testimonial, index) => {
        testimonial.style.animationDelay = `${index * 0.3}s`;
    });

    // CTAボタンのクリック追跡（アナリティクス用）
    document.addEventListener('click', function(e) {
        if (e.target.matches('.cta-button, .header-btn')) {
            // Google Analytics等のイベント送信
            if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                    event_category: 'CTA',
                    event_label: e.target.textContent.trim(),
                    value: 1
                });
            }
            
            // コンソールログでクリック確認（開発用）
            console.log('CTA Button Clicked:', e.target.textContent.trim());
        }
    });

    // スクロール進捗インジケーター
    const createScrollIndicator = () => {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 3px;
            background: linear-gradient(90deg, #d4a574, #b8956a);
            z-index: 9999;
            transition: width 0.3s ease;
        `;
        document.body.appendChild(indicator);

        window.addEventListener('scroll', () => {
            const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            indicator.style.width = scrolled + '%';
        });
    };

    createScrollIndicator();
});

// CSS animation keyframes for price glow effect
const style = document.createElement('style');
style.textContent = `
    @keyframes priceGlow {
        0% { text-shadow: 0 0 5px rgba(231, 76, 60, 0.5); }
        100% { text-shadow: 0 0 20px rgba(231, 76, 60, 0.8), 0 0 30px rgba(231, 76, 60, 0.6); }
    }
    
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    .testimonial {
        animation: fadeInUp 0.8s ease-out forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// ページ読み込み完了後の処理
window.addEventListener('load', function() {
    // ローディング完了時の処理
    console.log('カリウム for Beauty LP loaded successfully');
    
    // パフォーマンス測定
    if ('performance' in window) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log('Page load time:', loadTime + 'ms');
    }
});

// エラーハンドリング
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
});
