document.addEventListener('DOMContentLoaded', function() {
    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ヘッダーの背景変更
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.backdropFilter = 'blur(20px)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    });

    // スクロールアニメーション
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // アニメーション対象要素
    const animateElements = document.querySelectorAll(
        '.mineral-item, .point-item, .testimonial, .quality-item, .benefit-card, .institution-item'
    );
    
    animateElements.forEach(el => {
        observer.observe(el);
    });

    // 数字のカウントアップアニメーション
    const numberElements = document.querySelectorAll('.point-number');
    
    const numberObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const text = element.textContent;
                
                if (text.includes('1,320')) {
                    animateNumber(element, 1320, 'mg');
                } else if (text === '15種') {
                    animateNumber(element, 15, '種');
                } else if (text === '121種') {
                    animateNumber(element, 121, '種');
                }
                
                numberObserver.unobserve(element);
            }
        });
    }, { threshold: 0.5 });

    numberElements.forEach(el => {
        numberObserver.observe(el);
    });

    // 数字アニメーション関数
    function animateNumber(element, target, suffix = '') {
        let current = 0;
        const increment = target / 60;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            if (suffix === 'mg') {
                element.textContent = Math.floor(current).toLocaleString() + suffix;
            } else {
                element.textContent = Math.floor(current) + suffix;
            }
        }, 30);
    }

    // CTAボタンのクリック効果
    document.querySelectorAll('.cta-button, .hero-btn, .header-btn').forEach(button => {
        button.addEventListener('click', function() {
            // クリック効果
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // アナリティクス（必要に応じて）
            console.log('Button clicked:', this.textContent.trim());
        });
    });

    // カードホバー効果の強化
    document.querySelectorAll('.benefit-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // パララックス効果（軽微）
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.hero-image');
        
        parallaxElements.forEach(element => {
            const speed = 0.5;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

    // モバイル対応
    function adjustForMobile() {
        const isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('mobile', isMobile);
        
        // モバイルでのタッチ効果
        if (isMobile) {
            document.querySelectorAll('.benefit-card, .testimonial').forEach(element => {
                element.addEventListener('touchstart', function() {
                    this.style.transform = 'scale(0.98)';
                });
                
                element.addEventListener('touchend', function() {
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 150);
                });
            });
        }
    }

    window.addEventListener('resize', adjustForMobile);
    adjustForMobile();

    // レビューカルーセル初期化
    initReviewCarousel();

    console.log('カリウム for Beauty LP loaded successfully!');
});

// レビューカルーセル機能
function initReviewCarousel() {
    const slides = document.querySelectorAll('.review-slide');
    const dots = document.querySelectorAll('.nav-dot');
    const carousel = document.querySelector('.reviews-carousel');
    let currentSlide = 0;
    let autoPlayInterval;
    
    if (slides.length === 0) return;
    
    // 最初のスライドを表示
    slides[0].classList.add('active');
    
    function showSlide(index) {
        console.log('Showing slide:', index); // デバッグ用
        
        // 全てのスライドを非表示
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // 全てのドットを非アクティブ
        dots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // 指定のスライドとドットをアクティブ
        if (slides[index] && dots[index]) {
            slides[index].classList.add('active');
            dots[index].classList.add('active');
        }
        
        currentSlide = index;
    }
    
    // ドットクリックイベント
    dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showSlide(index);
        });
        
        // タッチイベントも追加
        dot.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showSlide(index);
        });
    });
    
    // スワイプ対応の改善
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let isDragging = false;
    
    if (carousel) {
        // タッチイベント
        carousel.addEventListener('touchstart', (e) => {
            console.log('Touch start'); // デバッグ用
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
        }, { passive: true });
        
        carousel.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = Math.abs(currentX - startX);
            const diffY = Math.abs(currentY - startY);
            
            // 横方向の移動が縦方向より大きい場合のみスクロールを防ぐ
            if (diffX > diffY && diffX > 10) {
                e.preventDefault();
            }
        }, { passive: false });
        
        carousel.addEventListener('touchend', (e) => {
            console.log('Touch end'); // デバッグ用
            if (!isDragging) return;
            
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            isDragging = false;
            
            handleSwipe();
        }, { passive: true });
        
        // マウスイベント（デスクトップ）
        carousel.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startY = e.clientY;
            isDragging = true;
            e.preventDefault();
        });
        
        carousel.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
        });
        
        carousel.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            
            endX = e.clientX;
            endY = e.clientY;
            isDragging = false;
            
            handleSwipe();
        });
        
        // マウスが要素外に出た場合
        carousel.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
            }
        });
    }
    
    function handleSwipe() {
        const threshold = 50;
        const diffX = startX - endX;
        const diffY = Math.abs(startY - endY);
        
        console.log('Swipe diff:', diffX, 'threshold:', threshold); // デバッグ用
        
        // 横方向の移動が縦方向より大きく、閾値を超えている場合のみ処理
        if (Math.abs(diffX) > threshold && Math.abs(diffX) > diffY) {
            if (diffX > 0) {
                // 左スワイプ - 次のスライド
                const nextSlide = (currentSlide + 1) % slides.length;
                showSlide(nextSlide);
            } else {
                // 右スワイプ - 前のスライド
                const prevSlide = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
                showSlide(prevSlide);
            }
        }
    }
    
    // 自動再生
    function startAutoPlay() {
        autoPlayInterval = setInterval(() => {
            const nextSlide = (currentSlide + 1) % slides.length;
            showSlide(nextSlide);
        }, 5000);
    }
    
    // 自動再生は無効（ユーザー操作のみで切り替え）
    // startAutoPlay(); // コメントアウトして自動再生を無効化
}
