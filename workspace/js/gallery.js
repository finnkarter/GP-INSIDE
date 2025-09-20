// 갤러리 페이지 JavaScript

let currentGalleryId = '';
let currentPage = 1;
let postsPerPage = 20;
let allPosts = [];
let filteredPosts = [];

// common.js가 먼저 초기화될 수 있도록 약간의 지연을 줌
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = getUrlParams();
    currentGalleryId = urlParams.id || 'free';
    
    initializeGalleryPage();
});

// 갤러리 페이지 초기화
function initializeGalleryPage() {
    loadGalleryInfo();
    loadPosts();
    highlightCurrentNavItem();
    
    // 검색 파라미터가 있으면 검색 수행
    const urlParams = getUrlParams();
    if (urlParams.search) {
        document.getElementById('gallerySearchInput').value = urlParams.search;
        searchPosts();
    }
}

// 갤러리 정보 로드
function loadGalleryInfo() {
    const gallery = getGalleryById(currentGalleryId);
    
    if (!gallery) {
        showError('갤러리를 찾을 수 없습니다.');
        return;
    }
    
    document.getElementById('galleryTitle').textContent = gallery.name;
    document.getElementById('galleryDescription').textContent = gallery.description;
    
    // 통계 업데이트
    updateGalleryStats(currentGalleryId);
    
    const posts = getPosts().filter(post => post.galleryId === currentGalleryId);
    const today = new Date().toDateString();
    const todayPosts = posts.filter(post => new Date(post.date).toDateString() === today);
    
    document.getElementById('postCount').textContent = posts.length;
    document.getElementById('todayPostCount').textContent = todayPosts.length;
    
    // 페이지 제목 업데이트
    document.title = `${gallery.name} - 영감 인사이드`;
}

// 게시글 로드
function loadPosts() {
    const posts = getPosts();
    allPosts = posts.filter(post => post.galleryId === currentGalleryId);
    
    // 기본 정렬 (최신순)
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filteredPosts = [...allPosts];
    currentPage = 1;
    
    renderPosts();
    renderPagination();
}

// 게시글 렌더링
function renderPosts() {
    const container = document.getElementById('postList');
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = filteredPosts.slice(startIndex, endIndex);
    
    if (postsToShow.length === 0) {
        container.innerHTML = `
            <div class="empty-posts">
                <h3>게시글이 없습니다</h3>
                <p>첫 번째 게시글을 작성해보세요!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = postsToShow.map((post, index) => {
        const comments = getComments().filter(c => c.postId === post.id);
        const postNumber = filteredPosts.length - startIndex - index;
        
        // 게시글 타입 확인
        const isNotice = post.type === 'notice';
        const isHot = (post.views || 0) + (post.likes || 0) * 2 > 50;
        
        let postClass = 'post-item';
        let postNumDisplay = postNumber;
        
        if (isNotice) {
            postClass += ' notice';
            postNumDisplay = '공지';
        } else if (isHot) {
            postClass += ' hot';
        }
        
        // 아이콘 생성
        let icons = '';
        if (isNotice) {
            icons += '<span class="post-icon icon-notice">공지</span>';
        }
        if (isHot && !isNotice) {
            icons += '<span class="post-icon icon-hot">HOT</span>';
        }
        if (new Date() - new Date(post.date) < 24 * 60 * 60 * 1000) {
            icons += '<span class="post-icon icon-new">NEW</span>';
        }
        if (post.hasImage) {
            icons += '<span class="post-icon icon-image">📷</span>';
        }
        
        // 댓글 수 표시
        let commentDisplay = '';
        if (comments.length > 0) {
            commentDisplay = `<span class="comment-count">[${comments.length}]</span>`;
        }
        
        // 작성자 클래스
        let authorClass = 'post-author';
        if (post.author === 'admin' || post.isAdmin) {
            authorClass += ' admin';
        }
        
        // 추천 수 표시
        let likesClass = 'post-likes';
        if ((post.likes || 0) > 0) {
            likesClass += ' positive';
        }
        
        return `
            <div class="${postClass}">
                <div class="post-number ${isNotice ? 'notice' : ''}">${postNumDisplay}</div>
                <div class="post-title-cell">
                    <a href="post.html?id=${post.id}" class="post-title-link">
                        ${escapeHtml(post.title)}
                    </a>
                    ${commentDisplay}
                    ${icons}
                </div>
                <div class="${authorClass}">${escapeHtml(post.author)}</div>
                <div class="post-views">${post.views || 0}</div>
                <div class="${likesClass}">${post.likes || 0}</div>
            </div>
        `;
    }).join('');
}

// 페이지네이션 렌더링
function renderPagination() {
    const container = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let pagination = '';
    
    // 이전 페이지
    if (currentPage > 1) {
        pagination += `<button onclick="goToPage(${currentPage - 1})">‹ 이전</button>`;
    } else {
        pagination += `<button class="disabled">‹ 이전</button>`;
    }
    
    // 페이지 번호들
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        pagination += `<button onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            pagination += `<span>...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            pagination += `<button class="current">${i}</button>`;
        } else {
            pagination += `<button onclick="goToPage(${i})">${i}</button>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pagination += `<span>...</span>`;
        }
        pagination += `<button onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // 다음 페이지
    if (currentPage < totalPages) {
        pagination += `<button onclick="goToPage(${currentPage + 1})">다음 ›</button>`;
    } else {
        pagination += `<button class="disabled">다음 ›</button>`;
    }
    
    container.innerHTML = pagination;
}

// 페이지 이동
function goToPage(page) {
    if (page < 1 || page > Math.ceil(filteredPosts.length / postsPerPage)) {
        return;
    }
    
    currentPage = page;
    renderPosts();
    renderPagination();
    
    // 스크롤을 상단으로
    window.scrollTo(0, 0);
}

// 게시글 정렬
function sortPosts() {
    const sortOption = document.getElementById('sortOption').value;
    
    switch (sortOption) {
        case 'latest':
            filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'popular':
            filteredPosts.sort((a, b) => {
                const popularityA = (a.views || 0) + (a.likes || 0) * 2;
                const popularityB = (b.views || 0) + (b.likes || 0) * 2;
                return popularityB - popularityA;
            });
            break;
        case 'views':
            filteredPosts.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
        case 'comments':
            filteredPosts.sort((a, b) => {
                const commentsA = getComments().filter(c => c.postId === a.id).length;
                const commentsB = getComments().filter(c => c.postId === b.id).length;
                return commentsB - commentsA;
            });
            break;
    }
    
    currentPage = 1;
    renderPosts();
    renderPagination();
}

// 게시글 필터링
function filterPosts() {
    const filterOption = document.getElementById('filterOption').value;
    
    switch (filterOption) {
        case 'all':
            filteredPosts = [...allPosts];
            break;
        case 'notice':
            filteredPosts = allPosts.filter(post => post.type === 'notice');
            break;
        case 'normal':
            filteredPosts = allPosts.filter(post => post.type !== 'notice');
            break;
        case 'hot':
            filteredPosts = allPosts.filter(post => {
                const popularity = (post.views || 0) + (post.likes || 0) * 2;
                return popularity > 50;
            });
            break;
    }
    
    currentPage = 1;
    renderPosts();
    renderPagination();
}

// 게시글 검색
function searchPosts() {
    const searchInput = document.getElementById('gallerySearchInput');
    const searchType = document.getElementById('searchType').value;
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        filteredPosts = [...allPosts];
    } else {
        filteredPosts = allPosts.filter(post => {
            switch (searchType) {
                case 'title':
                    return post.title.toLowerCase().includes(query);
                case 'content':
                    return post.content.toLowerCase().includes(query);
                case 'author':
                    return post.author.toLowerCase().includes(query);
                case 'all':
                    return post.title.toLowerCase().includes(query) ||
                           post.content.toLowerCase().includes(query) ||
                           post.author.toLowerCase().includes(query);
                default:
                    return false;
            }
        });
        
        // 검색 결과 표시
        const resultsContainer = document.querySelector('.search-results');
        if (resultsContainer) {
            resultsContainer.remove();
        }
        
        const searchResults = document.createElement('div');
        searchResults.className = 'search-results';
        searchResults.innerHTML = `
            <strong>"${escapeHtml(query)}"</strong> 검색 결과: ${filteredPosts.length}개의 게시글
        `;
        
        const postControls = document.querySelector('.post-controls');
        postControls.insertAdjacentElement('afterend', searchResults);
    }
    
    currentPage = 1;
    renderPosts();
    renderPagination();
}

// 게시글 새로고침
function refreshPosts() {
    const refreshBtn = document.querySelector('.refresh-btn');
    refreshBtn.textContent = '새로고침 중...';
    refreshBtn.disabled = true;
    
    setTimeout(() => {
        loadPosts();
        refreshBtn.textContent = '새로고침';
        refreshBtn.disabled = false;
        showSuccess('게시글 목록을 새로고침했습니다.');
    }, 500);
}

// 현재 네비게이션 항목 하이라이트
function highlightCurrentNavItem() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && href.includes(`id=${currentGalleryId}`)) {
            link.classList.add('active');
        }
    });
}

// 글쓰기 버튼 클릭 처리
function handleWriteButtonClick() {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        window.location.href = 'auth.html';
        return;
    }
    
    window.location.href = `write.html?gallery=${currentGalleryId}`;
}

// 키보드 이벤트 처리
document.addEventListener('keydown', function(e) {
    // 검색창에 포커스가 있지 않을 때만 단축키 작동
    if (document.activeElement.tagName !== 'INPUT') {
        switch (e.key) {
            case 'w':
            case 'W':
                handleWriteButtonClick();
                break;
            case 'r':
            case 'R':
                refreshPosts();
                break;
        }
    }
});

// 엔터키 검색 지원
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('gallerySearchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchPosts();
            }
        });
    }
});

// 전역 함수 등록
window.sortPosts = sortPosts;
window.filterPosts = filterPosts;
window.searchPosts = searchPosts;
window.refreshPosts = refreshPosts;
window.goToPage = goToPage;
