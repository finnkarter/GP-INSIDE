// 공통 JavaScript 함수들

// 로컬 스토리지 키 상수
const STORAGE_KEYS = {
    USERS: 'inspirationInside_users',
    CURRENT_USER: 'inspirationInside_currentUser',
    GALLERIES: 'inspirationInside_galleries',
    POSTS: 'inspirationInside_posts',
    COMMENTS: 'inspirationInside_comments',
    SETTINGS: 'inspirationInside_settings'
};

// 현재 로그인 사용자 정보
let currentUser = null;

// 초기화 함수
function init() {
    loadCurrentUser();
    updateUserInterface();
    initializeDefaultData();
    initializeTheme();
    
    // 사용자 활동 추적 시작
    if (currentUser) {
        trackUserActivity();
        
        // 5분마다 활동 시간 업데이트
        setInterval(trackUserActivity, 5 * 60 * 1000);
    }
}

// 현재 사용자 로드
function loadCurrentUser() {
    const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (userData) {
        currentUser = JSON.parse(userData);
    }
}

// 사용자 인터페이스 업데이트
function updateUserInterface() {
    const loginSection = document.getElementById('loginSection');
    const userSection = document.getElementById('userSection');
    const userNickname = document.getElementById('userNickname');
    const adminLink = document.getElementById('adminLink');
    
    if (currentUser) {
        if (loginSection) loginSection.style.display = 'none';
        if (userSection) userSection.style.display = 'block';
        if (userNickname) userNickname.textContent = currentUser.nickname;
        
        // 관리자 링크 표시
        if (adminLink) {
            adminLink.style.display = currentUser.isAdmin ? 'inline' : 'none';
        }
    } else {
        if (loginSection) loginSection.style.display = 'block';
        if (userSection) userSection.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

// 기본 데이터 초기화
function initializeDefaultData() {
    // 갤러리 초기화
    if (!localStorage.getItem(STORAGE_KEYS.GALLERIES)) {
        const defaultGalleries = [
            {
                id: 'humor',
                name: '유머 갤러리',
                description: '재미있는 이야기와 유머를 공유하는 공간',
                postCount: 0,
                todayPostCount: 0
            },
            {
                id: 'free',
                name: '자유게시판',
                description: '자유롭게 이야기를 나누는 공간',
                postCount: 0,
                todayPostCount: 0
            },
            {
                id: 'news',
                name: '뉴스 갤러리',
                description: '최신 뉴스와 이슈를 공유하는 공간',
                postCount: 0,
                todayPostCount: 0
            },
            {
                id: 'tech',
                name: '기술 갤러리',
                description: '기술 관련 정보와 토론 공간',
                postCount: 0,
                todayPostCount: 0
            },
            {
                id: 'game',
                name: '게임 갤러리',
                description: '게임 관련 소식과 공략 공간',
                postCount: 0,
                todayPostCount: 0
            }
        ];
        localStorage.setItem(STORAGE_KEYS.GALLERIES, JSON.stringify(defaultGalleries));
    }
    
    // 게시글 초기화
    if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
        const defaultPosts = [
            {
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
            }
        ];
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(defaultPosts));
    }
    
    // 댓글 초기화
    if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
        localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify([]));
    }
    
    // 사용자 초기화
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        // 기본 관리자 계정 생성
        const defaultUsers = [
            {
                id: 'lewishamilton44',
                password: 'LewisHamilton44!',
                nickname: 'Hamilton',
                email: 'hamilton@inspirationinside.com',
                joinDate: new Date().toISOString(),
                lastLogin: null,
                lastActivity: new Date().toISOString(),
                isActive: false,
                posts: [],
                comments: [],
                likes: [],
                bookmarks: [],
                isAdmin: true,
                role: 'super_admin',
                permissions: ['manage_users', 'manage_posts', 'manage_comments', 'manage_galleries', 'manage_reports', 'system_settings']
            }
        ];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    } else {
        // 기존 사용자가 있는 경우, 새 관리자 계정이 없으면 추가
        const users = getUsers();
        const adminExists = users.find(user => user.id === 'lewishamilton44');
        
        if (!adminExists) {
            const newAdmin = {
                id: 'lewishamilton44',
                password: 'LewisHamilton44!',
                nickname: 'Hamilton',
                email: 'hamilton@inspirationinside.com',
                joinDate: new Date().toISOString(),
                lastLogin: null,
                lastActivity: new Date().toISOString(),
                isActive: false,
                posts: [],
                comments: [],
                likes: [],
                bookmarks: [],
                isAdmin: true,
                role: 'super_admin',
                permissions: ['manage_users', 'manage_posts', 'manage_comments', 'manage_galleries', 'manage_reports', 'system_settings']
            };
            users.push(newAdmin);
            saveUsers(users);
        }
        
        // 기존 admin 계정 제거 (더 이상 사용하지 않음)
        const oldAdminIndex = users.findIndex(user => user.id === 'admin');
        if (oldAdminIndex !== -1) {
            users.splice(oldAdminIndex, 1);
            saveUsers(users);
        }
        
        // 기존 사용자들에게 새로운 필드 추가
        let needsUpdate = false;
        users.forEach(user => {
            if (user.isActive === undefined) {
                user.isActive = false; // 기본값: 비활성
                needsUpdate = true;
            }
            if (user.lastActivity === undefined) {
                user.lastActivity = user.lastLogin || user.joinDate;
                needsUpdate = true;
            }
            if (user.role === undefined) {
                user.role = user.isAdmin ? 'admin' : 'user';
                needsUpdate = true;
            }
        });
        
        if (needsUpdate) {
            saveUsers(users);
            console.log('기존 사용자들에게 새로운 필드 추가됨');
        }
    }
}

// 유틸리티 함수들
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}.${month}.${day} ${hours}:${minutes}`;
}

function timeAgo(date) {
    const now = new Date();
    const diffTime = Math.abs(now - new Date(date));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) {
        return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
        return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
        return `${diffDays}일 전`;
    } else {
        return formatDate(date);
    }
}

// 사용자 상태 업데이트 함수
function updateUserStatus(userId, isActive) {
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
        users[userIndex].isActive = isActive;
        users[userIndex].lastActivity = new Date().toISOString();
        if (isActive) {
            users[userIndex].lastLogin = new Date().toISOString();
        }
        saveUsers(users);
        console.log(`사용자 ${userId} 상태 업데이트: ${isActive ? '활성' : '비활성'}`);
    }
}

// 사용자 활동 추적 (페이지 활동 시 호출)
function trackUserActivity() {
    if (currentUser) {
        updateUserActivity(currentUser.id);
    }
}

// 사용자 활동 시간만 업데이트 (상태는 변경하지 않음)
function updateUserActivity(userId) {
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
        users[userIndex].lastActivity = new Date().toISOString();
        saveUsers(users);
    }
}

// 로그아웃 함수
function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        // 사용자 상태를 비활성으로 업데이트
        if (currentUser) {
            updateUserStatus(currentUser.id, false);
        }
        
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        currentUser = null;
        updateUserInterface();
        window.location.href = 'index.html';
    }
}

// 검색 함수
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (query) {
        window.location.href = `gallery.html?search=${encodeURIComponent(query)}`;
    }
}

// 로그인 체크 및 리다이렉트
function checkLoginAndRedirect(url) {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        window.location.href = 'auth.html';
        return false;
    }
    window.location.href = url;
    return true;
}

// URL 파라미터 파싱
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const queries = queryString.split('&');
    
    queries.forEach(query => {
        const pair = query.split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    });
    
    return params;
}

// 데이터 조작 함수들
function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getGalleries() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GALLERIES)) || [];
}

function saveGalleries(galleries) {
    localStorage.setItem(STORAGE_KEYS.GALLERIES, JSON.stringify(galleries));
}

function getPosts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS)) || [];
}

function savePosts(posts) {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
}

function getComments() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS)) || [];
}

function saveComments(comments) {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
}

// 게시글 관련 함수들
function getPostById(postId) {
    const posts = getPosts();
    return posts.find(post => post.id === postId);
}

function updatePost(postId, updateData) {
    const posts = getPosts();
    const index = posts.findIndex(post => post.id === postId);
    if (index !== -1) {
        posts[index] = { ...posts[index], ...updateData };
        savePosts(posts);
        return posts[index];
    }
    return null;
}

function deletePost(postId) {
    const posts = getPosts();
    const filteredPosts = posts.filter(post => post.id !== postId);
    savePosts(filteredPosts);
    
    // 댓글도 함께 삭제
    const comments = getComments();
    const filteredComments = comments.filter(comment => comment.postId !== postId);
    saveComments(filteredComments);
}

// 갤러리 관련 함수들
function getGalleryById(galleryId) {
    const galleries = getGalleries();
    return galleries.find(gallery => gallery.id === galleryId);
}

function updateGalleryStats(galleryId) {
    const galleries = getGalleries();
    const posts = getPosts();
    const today = new Date().toDateString();
    
    const galleryIndex = galleries.findIndex(g => g.id === galleryId);
    if (galleryIndex !== -1) {
        const galleryPosts = posts.filter(post => post.galleryId === galleryId);
        const todayPosts = galleryPosts.filter(post => new Date(post.date).toDateString() === today);
        
        galleries[galleryIndex].postCount = galleryPosts.length;
        galleries[galleryIndex].todayPostCount = todayPosts.length;
        
        saveGalleries(galleries);
    }
}

// 추천/비추천 함수들
function votePost(postId, voteType) {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    const posts = getPosts();
    const postIndex = posts.findIndex(post => post.id === postId);
    
    if (postIndex === -1) return;
    
    const post = posts[postIndex];
    
    // 이미 투표한 사용자인지 확인
    post.voters = post.voters || [];
    const existingVote = post.voters.find(voter => voter.userId === currentUser.id);
    
    if (existingVote) {
        if (existingVote.type === voteType) {
            alert('이미 ' + (voteType === 'like' ? '추천' : '비추천') + '하셨습니다.');
            return;
        } else {
            // 반대 투표로 변경
            existingVote.type = voteType;
            if (voteType === 'like') {
                post.likes = (post.likes || 0) + 1;
                post.dislikes = Math.max(0, (post.dislikes || 0) - 1);
            } else {
                post.dislikes = (post.dislikes || 0) + 1;
                post.likes = Math.max(0, (post.likes || 0) - 1);
            }
        }
    } else {
        // 새로운 투표
        post.voters.push({
            userId: currentUser.id,
            type: voteType,
            date: new Date().toISOString()
        });
        
        if (voteType === 'like') {
            post.likes = (post.likes || 0) + 1;
        } else {
            post.dislikes = (post.dislikes || 0) + 1;
        }
    }
    
    savePosts(posts);
    
    // UI 업데이트
    updateVoteDisplay(postId, post.likes || 0, post.dislikes || 0);
}

function updateVoteDisplay(postId, likes, dislikes) {
    const likeCount = document.getElementById('likeCount');
    const dislikeCount = document.getElementById('dislikeCount');
    
    if (likeCount) likeCount.textContent = likes;
    if (dislikeCount) dislikeCount.textContent = dislikes;
}

// 텍스트 처리 함수들
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function nl2br(text) {
    return text.replace(/\n/g, '<br>');
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// 에러 처리
function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    init();
    setupLiveSearch();
    setupKeyboardShortcuts();
    
    // 엔터키 검색 지원
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
});

// 테마 관련 함수들
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // 테마 아이콘 업데이트
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    
    // 페이지 배경 애니메이션
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
}

// 실시간 검색 자동완성
function setupLiveSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        
        if (query.length < 2) {
            hideSuggestions();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            showSearchSuggestions(query);
        }, 300);
    });
    
    // 외부 클릭 시 자동완성 숨기기
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-bar')) {
            hideSuggestions();
        }
    });
}

function showSearchSuggestions(query) {
    const posts = getPosts();
    const galleries = getGalleries();
    
    // 게시글 제목에서 검색
    const postSuggestions = posts
        .filter(post => post.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
        .map(post => ({
            type: 'post',
            title: post.title,
            subtitle: `${getGalleryById(post.galleryId)?.name || '알 수 없음'} · ${post.author}`,
            url: `post.html?id=${post.id}`
        }));
    
    // 갤러리에서 검색
    const gallerySuggestions = galleries
        .filter(gallery => gallery.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map(gallery => ({
            type: 'gallery',
            title: gallery.name,
            subtitle: gallery.description,
            url: `gallery.html?id=${gallery.id}`
        }));
    
    const suggestions = [...gallerySuggestions, ...postSuggestions];
    
    if (suggestions.length > 0) {
        renderSuggestions(suggestions);
    } else {
        hideSuggestions();
    }
}

function renderSuggestions(suggestions) {
    let suggestionBox = document.getElementById('searchSuggestions');
    
    if (!suggestionBox) {
        suggestionBox = document.createElement('div');
        suggestionBox.id = 'searchSuggestions';
        suggestionBox.className = 'search-suggestions';
        document.querySelector('.search-bar').appendChild(suggestionBox);
    }
    
    suggestionBox.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" onclick="navigateToSuggestion('${suggestion.url}')">
            <div class="suggestion-title">${escapeHtml(suggestion.title)}</div>
            <div class="suggestion-subtitle">${escapeHtml(suggestion.subtitle)}</div>
            <span class="suggestion-type">${suggestion.type === 'gallery' ? '갤러리' : '게시글'}</span>
        </div>
    `).join('');
    
    suggestionBox.style.display = 'block';
}

function hideSuggestions() {
    const suggestionBox = document.getElementById('searchSuggestions');
    if (suggestionBox) {
        suggestionBox.style.display = 'none';
    }
}

function navigateToSuggestion(url) {
    window.location.href = url;
}

// 키보드 단축키
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl + / : 검색창 포커스
        if (e.ctrlKey && e.key === '/') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Ctrl + D : 다크 테마 토글
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            toggleTheme();
        }
        
        // Esc : 모달 닫기, 검색 자동완성 숨기기
        if (e.key === 'Escape') {
            hideSuggestions();
            
            // 열려있는 모달 닫기
            const openModals = document.querySelectorAll('.modal[style*="display: flex"], .modal[style*="display: block"]');
            openModals.forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
}

// 알림 시스템
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${escapeHtml(message)}</span>
            <button class="notification-close" onclick="closeNotification(this)">×</button>
        </div>
    `;
    
    // 알림 컨테이너 생성 또는 가져오기
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // 애니메이션
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // 자동 제거
    setTimeout(() => {
        closeNotification(notification.querySelector('.notification-close'));
    }, duration);
}

function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

function closeNotification(button) {
    const notification = button.closest('.notification');
    notification.classList.add('hide');
    setTimeout(() => {
        notification.remove();
    }, 300);
}

// 북마크 시스템
function toggleBookmark(postId) {
    if (!currentUser) {
        showNotification('로그인이 필요합니다.', 'warning');
        return;
    }
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) return;
    
    const user = users[userIndex];
    user.bookmarks = user.bookmarks || [];
    
    const bookmarkIndex = user.bookmarks.indexOf(postId);
    
    if (bookmarkIndex === -1) {
        user.bookmarks.push(postId);
        showNotification('북마크에 추가되었습니다.', 'success');
    } else {
        user.bookmarks.splice(bookmarkIndex, 1);
        showNotification('북마크에서 제거되었습니다.', 'info');
    }
    
    saveUsers(users);
    currentUser = user;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    
    // 북마크 버튼 UI 업데이트
    updateBookmarkButton(postId, bookmarkIndex === -1);
}

function updateBookmarkButton(postId, isBookmarked) {
    const bookmarkBtn = document.querySelector('.bookmark-btn');
    if (bookmarkBtn) {
        bookmarkBtn.textContent = isBookmarked ? '북마크 제거' : '북마크';
        bookmarkBtn.classList.toggle('bookmarked', isBookmarked);
    }
}

function isPostBookmarked(postId) {
    if (!currentUser || !currentUser.bookmarks) return false;
    return currentUser.bookmarks.includes(postId);
}

// 관리자 권한 확인 함수들
function isAdmin() {
    return currentUser && currentUser.isAdmin === true;
}

function isSuperAdmin() {
    return currentUser && currentUser.role === 'super_admin';
}

function hasPermission(permission) {
    if (!currentUser || !currentUser.permissions) return false;
    return currentUser.permissions.includes(permission);
}

function checkAdminAccess() {
    if (!isAdmin()) {
        showNotification('관리자 권한이 필요합니다.', 'error');
        return false;
    }
    return true;
}

function checkSuperAdminAccess() {
    if (!isSuperAdmin()) {
        showNotification('최고 관리자 권한이 필요합니다.', 'error');
        return false;
    }
    return true;
}

// 특정 권한 확인
function canManageUsers() {
    return hasPermission('manage_users');
}

function canManagePosts() {
    return hasPermission('manage_posts');
}

function canManageComments() {
    return hasPermission('manage_comments');
}

function canManageGalleries() {
    return hasPermission('manage_galleries');
}

function canManageReports() {
    return hasPermission('manage_reports');
}

function canAccessSystemSettings() {
    return hasPermission('system_settings');
}

// 전역 함수로 내보내기
window.logout = logout;
window.performSearch = performSearch;
window.checkLoginAndRedirect = checkLoginAndRedirect;
window.votePost = votePost;
window.toggleTheme = toggleTheme;
window.navigateToSuggestion = navigateToSuggestion;
window.closeNotification = closeNotification;
window.toggleBookmark = toggleBookmark;
