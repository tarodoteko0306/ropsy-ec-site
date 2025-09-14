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

    console.log('カリウム for Beauty LP loaded successfully!');
});
