// UI 관련 함수들

// 통계 애니메이션
function animateStats() {
    const onlineUsers = document.getElementById('onlineUsers');
    const totalPosts = document.getElementById('totalPosts');
    
    setInterval(() => {
        const currentOnline = parseInt(onlineUsers.textContent.replace(',', ''));
        const change = Math.floor(Math.random() * 20) - 10;
        const newValue = Math.max(1000, currentOnline + change);
        onlineUsers.textContent = newValue.toLocaleString();
    }, 5000);
    
    totalPosts.textContent = AppState.posts.length.toLocaleString();
}

// 뷰 모드 변경
function changeView(view) {
    AppState.currentView = view;
    const container = document.getElementById('postsContainer');
    
    if (view === 'list') {
        container.classList.add('list-view');
    } else {
        container.classList.remove('list-view');
    }
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
}

// 다크모드 토글
function toggleDarkMode() {
    AppState.darkMode = !AppState.darkMode;
    document.body.classList.toggle('light-mode', !AppState.darkMode);
    saveState();
    
    const icon = document.querySelector('#darkModeBtn');
    if (icon) {
        icon.textContent = AppState.darkMode ? '☀️' : '🌙';
    }
    
    showNotification(AppState.darkMode ? '다크모드 활성화' : '라이트모드 활성화');
}

// 페이지네이션 렌더링
function renderPagination() {
    const totalPages = Math.ceil(AppState.filteredPosts.length / AppState.postsPerPage);
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.disabled = AppState.currentPage === 1;
    nextBtn.disabled = AppState.currentPage === totalPages || totalPages === 0;
    
    let pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, AppState.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pages.push(`
            <button class="page-number ${i === AppState.currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>
        `);
    }
    
    pageNumbers.innerHTML = pages.join('');
    
    pageNumbers.querySelectorAll('.page-number').forEach(btn => {
        btn.addEventListener('click', () => {
            AppState.currentPage = parseInt(btn.dataset.page);
            renderPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// 좋아요 애니메이션
function animateLike(element) {
    element.classList.add('liked');
    
    // 하트 이펙트
    for (let i = 0; i < 5; i++) {
        const heart = document.createElement('span');
        heart.className = 'heart-particle';
        heart.textContent = '❤️';
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.animationDelay = `${i * 0.1}s`;
        element.appendChild(heart);
        
        setTimeout(() => heart.remove(), 1000);
    }
    
    setTimeout(() => element.classList.remove('liked'), 300);
}

// 북마크 토글 UI
function updateBookmarkUI(postId) {
    const bookmarkBtns = document.querySelectorAll(`[data-bookmark-id="${postId}"]`);
    const isBookmarked = AppState.bookmarks.has(postId);
    
    bookmarkBtns.forEach(btn => {
        btn.textContent = isBookmarked ? '🔖' : '📑';
        btn.classList.toggle('bookmarked', isBookmarked);
    });
}

// 로딩 스피너 표시
function showLoading(show = true) {
    let loader = document.getElementById('loading-spinner');
    
    if (show && !loader) {
        loader = document.createElement('div');
        loader.id = 'loading-spinner';
        loader.className = 'loading-spinner';
        loader.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loader);
    } else if (!show && loader) {
        loader.remove();
    }
}

// 모달 열기/닫기
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// 트렌딩 리스트 업데이트
function updateTrendingList() {
    const trendingList = document.querySelector('.trending-list');
    if (!trendingList) return;
    
    const topPosts = [...AppState.posts]
        .sort((a, b) => (b.likes + b.comments * 2) - (a.likes + a.comments * 2))
        .slice(0, 5);
    
    trendingList.innerHTML = topPosts.map((post, index) => `
        <li class="trending-item" data-post-id="${post.id}">
            <span class="trending-rank">${index + 1}</span>
            <span class="trending-title">${post.title}</span>
        </li>
    `).join('');
    
    // 클릭 이벤트
    trendingList.querySelectorAll('.trending-item').forEach(item => {
        item.addEventListener('click', () => {
            const postId = parseInt(item.dataset.postId);
            openPostDetail(postId);
        });
    });
}
