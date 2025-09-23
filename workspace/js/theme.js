// 테마 관리 모듈
class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    // 초기화
    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeToggle();
        this.bindEvents();
    }

    // 저장된 테마 가져오기
    getStoredTheme() {
        return localStorage.getItem('gp-theme');
    }

    // 시스템 테마 감지
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // 테마 적용
    applyTheme(theme) {
        // 전환 애니메이션을 위한 클래스 추가
        document.body.classList.add('theme-transition');
        
        // 테마 설정
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        
        // 로컬 스토리지에 저장
        localStorage.setItem('gp-theme', theme);
        
        // 테마 토글 버튼 업데이트
        this.updateToggleButton();
        
        // 애니메이션 클래스 제거
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);
        
        // 테마 변경 알림 표시
        this.showThemeStatus(theme);
    }

    // 테마 전환
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    // 테마 토글 버튼 생성
    createThemeToggle() {
        const userMenu = document.querySelector('.user-menu');
        if (!userMenu) return;

        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.setAttribute('aria-label', '테마 전환');
        themeToggle.setAttribute('title', '다크/라이트 모드 전환');
        
        themeToggle.innerHTML = `
            <span class="theme-toggle-icon sun-icon">☀️</span>
            <span class="theme-toggle-icon moon-icon">🌙</span>
        `;

        // 사용자 메뉴 앞에 삽입
        userMenu.insertBefore(themeToggle, userMenu.firstChild);
        
        this.toggleButton = themeToggle;
        this.updateToggleButton();
    }

    // 토글 버튼 업데이트
    updateToggleButton() {
        if (!this.toggleButton) return;
        
        const isDark = this.currentTheme === 'dark';
        this.toggleButton.setAttribute('aria-pressed', isDark);
        this.toggleButton.setAttribute('title', 
            isDark ? '라이트 모드로 전환' : '다크 모드로 전환'
        );
    }

    // 이벤트 바인딩
    bindEvents() {
        // 토글 버튼 클릭
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // 키보드 단축키 (Ctrl/Cmd + Shift + D)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        // 시스템 테마 변경 감지
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // 사용자가 직접 테마를 설정하지 않은 경우에만 시스템 테마 따라가기
                if (!this.getStoredTheme()) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    // 테마 상태 알림 표시
    showThemeStatus(theme) {
        // 기존 상태 메시지 제거
        const existingStatus = document.querySelector('.theme-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // 새 상태 메시지 생성
        const status = document.createElement('div');
        status.className = 'theme-status';
        status.textContent = theme === 'dark' ? '🌙 다크 모드' : '☀️ 라이트 모드';
        
        document.body.appendChild(status);
        
        // 애니메이션으로 표시
        setTimeout(() => status.classList.add('show'), 100);
        
        // 2초 후 제거
        setTimeout(() => {
            status.classList.remove('show');
            setTimeout(() => status.remove(), 300);
        }, 2000);
    }

    // 현재 테마 반환
    getCurrentTheme() {
        return this.currentTheme;
    }

    // 다크 모드 여부 확인
    isDarkMode() {
        return this.currentTheme === 'dark';
    }

    // 테마 설정 (외부에서 호출 가능)
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
        }
    }

    // 시스템 테마 감지 및 적용
    followSystemTheme() {
        const systemTheme = this.getSystemTheme();
        this.applyTheme(systemTheme);
        
        // 로컬 스토리지에서 테마 설정 제거 (시스템 테마 따라가기)
        localStorage.removeItem('gp-theme');
        
        this.showThemeStatus('시스템 설정 따라가기');
    }

    // 테마 초기화
    resetTheme() {
        localStorage.removeItem('gp-theme');
        const systemTheme = this.getSystemTheme();
        this.applyTheme(systemTheme);
    }

    // 테마별 특별 기능
    enableDarkModeFeatures() {
        if (this.isDarkMode()) {
            // 다크 모드 전용 기능들
            this.adjustImagesForDarkMode();
            this.updateScrollbarStyle();
        }
    }

    // 다크 모드에서 이미지 조정
    adjustImagesForDarkMode() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (this.isDarkMode()) {
                img.style.filter = 'brightness(0.9)';
            } else {
                img.style.filter = 'none';
            }
        });
    }

    // 스크롤바 스타일 업데이트
    updateScrollbarStyle() {
        const style = document.getElementById('dynamic-scrollbar-style');
        if (style) style.remove();

        const newStyle = document.createElement('style');
        newStyle.id = 'dynamic-scrollbar-style';
        
        if (this.isDarkMode()) {
            newStyle.textContent = `
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: var(--surface-color); }
                ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: var(--text-secondary); }
            `;
        }
        
        document.head.appendChild(newStyle);
    }

    // 테마 통계 정보
    getThemeStats() {
        return {
            currentTheme: this.currentTheme,
            isSystemTheme: !this.getStoredTheme(),
            systemTheme: this.getSystemTheme(),
            supportsSystemDetection: !!window.matchMedia
        };
    }
}
