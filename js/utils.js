// 유틸리티 함수들

// 시간 포맷팅
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        년: 31536000,
        개월: 2592000,
        주: 604800,
        일: 86400,
        시간: 3600,
        분: 60
    };
    
    for (let [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval}${unit} 전`;
        }
    }
    
    return '방금 전';
}

// 숫자 포맷팅 (1000 -> 1K)
function formatNumber(num) {
    if (!num && num !== 0) return '0';
    num = Number(num);
    if (isNaN(num)) return '0';
    
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// 디바운스 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 랜덤 색상 생성
function getRandomColor() {
    const colors = [
        'linear-gradient(135deg, #00d9ff, #7b2cbf)',
        'linear-gradient(135deg, #ff006e, #8338ec)',
        'linear-gradient(135deg, #06ffa5, #00d4ff)',
        'linear-gradient(135deg, #f72585, #7209b7)',
        'linear-gradient(135deg, #4cc9f0, #4361ee)'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// 알림 표시
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 애니메이션
    setTimeout(() => notification.classList.add('show'), 10);
    
    // 자동 제거
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 확인 다이얼로그
function showConfirm(message) {
    return confirm(message);
}
