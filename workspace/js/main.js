// 메인 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // common.js의 초기화가 완료된 후 메인 페이지 데이터 로드
    init(); // common.js의 초기화 함수 실행
    loadMainPageData(); // 초기화 직후 데이터 로드
});

// 메인 페이지 데이터 로드
function loadMainPageData() {
    // 공지사항 데이터 확보
    ensureWelcomePost();
    
    loadPopularPosts();
    loadGalleryList();
    loadRecentPosts();
    loadNotices();
    updateTrendingKeywords();
    updateAdminUI();
    
    // 관리자 UI 강제 업데이트
    forceUpdateAdminUI();
}

// 환영 공지사항 확보
function ensureWelcomePost() {
    const posts = getPosts();
    const welcomeExists = posts.find(post => post.id === 'welcome_post');
    
    if (!welcomeExists) {
        console.log('환영 공지사항이 없음, 생성함');
        const welcomePost = {
            id: 'welcome_post',
            title: '영감 인사이드 오픈!',
            content: '영감 인사이드를 만든 이유는 단 하나, 죽었던 무덤을 이어가기 위해서이기에 그 이유를 잘 실천해줬으면 합니다.',
            author: 'Hamilton',
            authorId: 'lewishamilton44',
            galleryId: 'free',
            date: new Date().toISOString(),
            views: 1,
            likes: 0,
            type: 'notice',
            tags: ['공지', '오픈']
        };
        
        posts.push(welcomePost);
        savePosts(posts);
        console.log('환영 공지사항 생성 완료');
    } else {
        console.log('환영 공지사항 존재함');
    }
}

// 관리자 UI 업데이트 (강화된 버전)
function updateAdminUI() {
    const currentUser = getCurrentUser();
    const addNoticeBtn = document.getElementById('addNoticeBtn');
    
    console.log('관리자 UI 체크:', {
        user: currentUser?.nickname,
        isAdmin: currentUser?.isAdmin,
        buttonExists: !!addNoticeBtn
    });
    
    if (addNoticeBtn) {
        if (currentUser?.isAdmin) {
            addNoticeBtn.classList.add('show');
            addNoticeBtn.style.display = 'flex'; // 강제 표시
            console.log('관리자 버튼 표시됨');
        } else {
            addNoticeBtn.classList.remove('show');
            addNoticeBtn.style.display = 'none';
            console.log('관리자 버튼 숨김');
        }
    }
}

// 강제 관리자 UI 업데이트 (페이지 로드 후)
function forceUpdateAdminUI() {
    setTimeout(() => {
        updateAdminUI();
        // 한 번 더 체크
        setTimeout(updateAdminUI, 500);
    }, 200);
}

// 공지사항 작성 (개선된 버전)
function createNotice() {
    const currentUser = getCurrentUser();
    
    console.log('공지사항 작성 요청:', currentUser);
    
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        window.location.href = 'auth.html';
        return;
    }
    
    if (!currentUser.isAdmin) {
        alert('관리자 권한이 필요합니다.\n현재 사용자: ' + currentUser.nickname);
        return;
    }
    
    console.log('공지사항 작성 페이지로 이동');
    window.location.href = 'write.html?notice=true&gallery=free';
}

// 공지사항 로드 (개선된 버전)
function loadNotices() {
    const container = document.querySelector('.notice-list');
    if (!container) {
        console.log('공지사항 컨테이너를 찾을 수 없습니다');
        return;
    }
    
    const posts = getPosts();
    console.log('전체 게시글 수:', posts.length);
    
    const notices = posts
        .filter(post => post.type === 'notice')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    console.log('공지사항 수:', notices.length);
    
    if (notices.length === 0) {
        console.log('공지사항이 없음, 기본 공지사항 표시');
        // 공지사항이 없으면 기본 공지사항 생성
        createDefaultNotice();
        return;
    }
    
    console.log('공지사항 발견:', notices.map(n => n.title));
    
    container.innerHTML = notices.map(notice => {
        const isNew = new Date() - new Date(notice.date) < 24 * 60 * 60 * 1000;
        const newMark = isNew ? '<span class="new-mark">NEW</span>' : '';
        
        return `
            <li>
                <a href="post.html?id=${notice.id}">
                    ${escapeHtml(notice.title)}
                    ${newMark}
                </a>
            </li>
        `;
    }).join('');
    
    console.log('공지사항 로딩 완료');
}

// 기본 공지사항 생성 (실제 링크 연결)
function createDefaultNotice() {
    const container = document.querySelector('.notice-list');
    const posts = getPosts();
    
    // 실제 공지사항이 있는지 다시 확인
    const welcomePost = posts.find(post => post.id === 'welcome_post');
    
    if (welcomePost) {
        // 실제 공지사항이 있으면 연결
        container.innerHTML = `
            <li><a href="post.html?id=${welcomePost.id}">📢 ${escapeHtml(welcomePost.title)} <span class="new-mark">NEW</span></a></li>
            <li><a href="#" onclick="alert('준비중입니다.')">📋 이용규칙 안내</a></li>
            <li><a href="#" onclick="alert('준비중입니다.')">🔧 서비스 업데이트</a></li>
            <li><a href="#" onclick="refreshNotices()" style="color: var(--accent-color);">🔄 공지사항 새로고침</a></li>
        `;
    } else {
        // 공지사항이 없으면 생성 버튼
        container.innerHTML = `
            <li><a href="#" onclick="createWelcomePost()">📢 환영 공지사항 만들기 <span class="new-mark">NEW</span></a></li>
            <li><a href="#" onclick="alert('준비중입니다.')">📋 이용규칙 안내</a></li>
            <li><a href="#" onclick="alert('준비중입니다.')">🔧 서비스 업데이트</a></li>
            <li><a href="#" onclick="refreshNotices()" style="color: var(--accent-color);">🔄 공지사항 새로고침</a></li>
        `;
    }
}

// 공지사항 새로고침
function refreshNotices() {
    console.log('공지사항 새로고침 시작');
    
    // LocalStorage 확인
    const posts = getPosts();
    console.log('저장된 게시글:', posts);
    
    // 강제로 공지사항 재로드
    loadNotices();
    
    alert('공지사항이 새로고침되었습니다.\n게시글 수: ' + posts.length);
}

// 환영 공지사항 생성
function createWelcomePost() {
    const posts = getPosts();
    
    // 환영 공지사항 생성
    const welcomePost = {
        id: 'welcome_post',
        title: '영감 인사이드 오픈!',
        content: '영감 인사이드를 만든 이유는 단 하나, 죽었던 무덤을 이어가기 위해서이기에 그 이유를 잘 실천해줬으면 합니다.',
        author: 'Hamilton',
        authorId: 'lewishamilton44',
        galleryId: 'free',
        date: new Date().toISOString(),
        views: 1,
        likes: 0,
        type: 'notice',
        tags: ['공지', '오픈']
    };
    
    posts.push(welcomePost);
    savePosts(posts);
    
    alert('환영 공지사항이 생성되었습니다!');
    
    // 공지사항 다시 로드
    loadNotices();
    
    // 생성된 공지사항으로 이동
    window.location.href = `post.html?id=${welcomePost.id}`;
}

// 인기글 로드
function loadPopularPosts() {
    const container = document.getElementById('popularPosts');
    if (!container) return;
    
    const posts = getPosts();
    
    // 인기도 계산 (조회수 + 추천수 * 2 + 댓글수 * 1.5)
    const popularPosts = posts
        .map(post => {
            const comments = getComments().filter(c => c.postId === post.id);
            const popularity = (post.views || 0) + (post.likes || 0) * 2 + comments.length * 1.5;
            return { ...post, popularity, commentCount: comments.length };
        })
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 5);
    
    if (popularPosts.length === 0) {
        container.innerHTML = '<div class="empty-message">인기글이 없습니다.</div>';
        return;
    }
    
    container.innerHTML = popularPosts.map(post => {
        const gallery = getGalleryById(post.galleryId);
        const galleryName = gallery ? gallery.name : '알 수 없음';
        
        let hotMark = '';
        if (post.popularity > 50) {
            hotMark = '<span class="hot-mark">HOT</span>';
        }
        
        let commentDisplay = '';
        if (post.commentCount > 0) {
            commentDisplay = `<span class="comment-count">[${post.commentCount}]</span>`;
        }
        
        return `
            <div class="post-item">
                <div class="post-title">
                    <a href="post.html?id=${post.id}">${escapeHtml(post.title)}${commentDisplay}${hotMark}</a>
                </div>
                <div class="post-meta">
                    <span class="gallery">${galleryName}</span>
                    <span class="author">${escapeHtml(post.author)}</span>
                    <span class="stats">조회 ${post.views || 0} · 추천 ${post.likes || 0}</span>
                </div>
            </div>
        `;
    }).join('');
}

// 갤러리 목록 로드
function loadGalleryList() {
    const container = document.getElementById('galleryList');
    if (!container) return;
    
    const galleries = getGalleries();
    const posts = getPosts();
    
    // 각 갤러리의 통계 업데이트
    galleries.forEach(gallery => {
        const galleryPosts = posts.filter(post => post.galleryId === gallery.id);
        const today = new Date().toDateString();
        const todayPosts = galleryPosts.filter(post => new Date(post.date).toDateString() === today);
        
        gallery.postCount = galleryPosts.length;
        gallery.todayPostCount = todayPosts.length;
    });
    
    container.innerHTML = galleries.map(gallery => `
        <div class="gallery-item">
            <a href="gallery.html?id=${gallery.id}">
                <h3>${escapeHtml(gallery.name)}</h3>
                <p>${escapeHtml(gallery.description)}</p>
                <div class="gallery-stats">
                    <span>게시글 ${gallery.postCount}</span>
                    <span>오늘 ${gallery.todayPostCount}</span>
                </div>
            </a>
        </div>
    `).join('');
}

// 최신글 로드
function loadRecentPosts() {
    const container = document.getElementById('recentPosts');
    if (!container) return;
    
    const posts = getPosts();
    const recentPosts = posts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
    
    if (recentPosts.length === 0) {
        container.innerHTML = '<div class="empty-message">최신글이 없습니다.</div>';
        return;
    }
    
    container.innerHTML = recentPosts.map(post => {
        const gallery = getGalleryById(post.galleryId);
        const galleryName = gallery ? gallery.name : '알 수 없음';
        const comments = getComments().filter(c => c.postId === post.id);
        
        // 새 글 표시 (24시간 이내)
        const isNew = new Date() - new Date(post.date) < 24 * 60 * 60 * 1000;
        const newMark = isNew ? '<span class="new-mark">NEW</span>' : '';
        
        let commentDisplay = '';
        if (comments.length > 0) {
            commentDisplay = `<span class="comment-count">[${comments.length}]</span>`;
        }
        
        return `
            <div class="post-item">
                <div class="post-title">
                    <a href="post.html?id=${post.id}">${escapeHtml(post.title)}${commentDisplay}${newMark}</a>
                </div>
                <div class="post-meta">
                    <span class="gallery">${galleryName}</span>
                    <span class="author">${escapeHtml(post.author)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// 실시간 인기 검색어 업데이트
function updateTrendingKeywords() {
    const container = document.getElementById('trendingKeywords');
    if (!container) return;
    
    // 실제로는 검색 기록을 바탕으로 생성해야 하지만, 
    // 데모용으로 하드코딩된 키워드 사용
    const trendingKeywords = [
        '영감',
        '인사이드',
        '커뮤니티',
        '게시판',
        '디시',
        '갤러리',
        '유머',
        '자유',
        '뉴스',
        '기술'
    ];
    
    container.innerHTML = trendingKeywords.slice(0, 5).map((keyword, index) => `
        <li>
            <span class="rank">${index + 1}</span>
            <a href="gallery.html?search=${encodeURIComponent(keyword)}">${escapeHtml(keyword)}</a>
        </li>
    `).join('');
}

// 데이터 새로고침
function refreshMainData() {
    const container = document.querySelector('.main-container');
    container.style.opacity = '0.6';
    
    setTimeout(() => {
        loadMainPageData();
        container.style.opacity = '1';
    }, 500);
}

// 갤러리 빠른 이동
function navigateToGallery(galleryId) {
    window.location.href = `gallery.html?id=${galleryId}`;
}

// 검색 자동완성 (향후 구현)
function setupSearchAutocomplete() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    // 자동완성 기능 구현 예정
}

// 실시간 업데이트 (향후 구현)
function startRealTimeUpdates() {
    // 실시간으로 새 글, 댓글 등을 업데이트하는 기능
    setInterval(() => {
        // 실제로는 서버에서 새 데이터를 가져와야 함
        // 로컬 스토리지에서는 의미가 없지만 구조상 유지
    }, 30000); // 30초마다 업데이트
}

// 통계 데이터 생성 (관리자용)
function generateSiteStats() {
    const users = getUsers();
    const posts = getPosts();
    const comments = getComments();
    const galleries = getGalleries();
    
    const stats = {
        totalUsers: users.length,
        totalPosts: posts.length,
        totalComments: comments.length,
        totalGalleries: galleries.length,
        todayPosts: posts.filter(post => {
            const today = new Date().toDateString();
            return new Date(post.date).toDateString() === today;
        }).length,
        popularGallery: galleries.reduce((prev, current) => {
            return (prev.postCount > current.postCount) ? prev : current;
        }, galleries[0])
    };
    
    return stats;
}

// 페이지 성능 모니터링
function trackPagePerformance() {
    if ('performance' in window) {
        window.addEventListener('load', function() {
            const perfData = performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            
            // 로딩 시간이 3초 이상이면 최적화 필요
            if (pageLoadTime > 3000) {
                console.warn('페이지 로딩 시간이 긴 편입니다:', pageLoadTime + 'ms');
            }
        });
    }
}

// 초기화
trackPagePerformance();

// 전역 함수 등록
window.refreshMainData = refreshMainData;
window.navigateToGallery = navigateToGallery;
window.createWelcomePost = createWelcomePost;
window.refreshNotices = refreshNotices;
window.createNotice = createNotice;


