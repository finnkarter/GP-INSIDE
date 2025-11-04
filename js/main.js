// 메인 초기화 및 이벤트 바인딩

// 초기화
function init() {
    // 인증 초기화
    initAuth();
    
    // 상태 로드
    loadState();
    
    // 기존 예시 게시글 데이터 완전 삭제 (최초 1회)
    if (!localStorage.getItem('gp_inside_posts_cleared')) {
        clearPosts();
        localStorage.setItem('gp_inside_posts_cleared', 'true');
    }
    
    // 다크모드 적용
    if (!AppState.darkMode) {
        document.body.classList.add('light-mode');
    }
    
    // 게시글 필터링 및 렌더링
    filterPosts();
    renderPosts();
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 통계 애니메이션 시작
    animateStats();
    
    // 트렌딩 리스트 업데이트
    updateTrendingList();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 카테고리 클릭
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            AppState.currentCategory = item.dataset.category;
            AppState.currentPage = 1;
            filterPosts();
            renderPosts();
        });
    });
    
    // 정렬 버튼
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.currentSort = btn.dataset.sort;
            AppState.currentPage = 1;
            filterPosts();
            renderPosts();
        });
    });
    
    // 뷰 버튼
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            changeView(btn.dataset.view);
        });
    });
    
    // 검색 기능
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    const debouncedSearch = debounce(() => {
        AppState.searchQuery = searchInput.value.trim();
        AppState.currentPage = 1;
        filterPosts();
        renderPosts();
    }, 300);
    
    searchInput.addEventListener('input', debouncedSearch);
    
    searchBtn.addEventListener('click', () => {
        AppState.searchQuery = searchInput.value.trim();
        AppState.currentPage = 1;
        filterPosts();
        renderPosts();
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
    
    // 페이지네이션
    document.getElementById('prevPage').addEventListener('click', () => {
        if (AppState.currentPage > 1) {
            AppState.currentPage--;
            renderPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(AppState.filteredPosts.length / AppState.postsPerPage);
        if (AppState.currentPage < totalPages) {
            AppState.currentPage++;
            renderPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    // 게시글 상세 모달
    document.getElementById('closePostModal').addEventListener('click', () => {
        closeModal('postModal');
    });
    
    // 모달 배경 클릭시 닫기
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    });
    
    // 로고 클릭시 홈으로
    document.querySelector('.logo').addEventListener('click', () => {
        AppState.currentCategory = 'all';
        AppState.searchQuery = '';
        searchInput.value = '';
        document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        document.querySelector('.category-item[data-category="all"]').classList.add('active');
        filterPosts();
        renderPosts();
    });
    
    // 다크모드 토글 (새로 추가)
    const darkModeBtn = document.getElementById('darkModeBtn');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', toggleDarkMode);
    }
}

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', init);
