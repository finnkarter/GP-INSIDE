// 전역 상태 관리
const AppState = {
    currentCategory: 'all',
    currentSort: 'hot',
    currentView: 'card',
    currentPage: 1,
    postsPerPage: 10,
    posts: [],
    filteredPosts: [],
    searchQuery: '',
    bookmarks: new Set(),
    darkMode: true,
    notifications: []
};

// 로컬스토리지 키
const STORAGE_KEYS = {
    POSTS: 'gp_inside_posts',
    BOOKMARKS: 'gp_inside_bookmarks',
    DARK_MODE: 'gp_inside_dark_mode',
    USER_SETTINGS: 'gp_inside_user_settings'
};

// 상태 저장
function saveState() {
    try {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(AppState.posts));
        localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(Array.from(AppState.bookmarks)));
        localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(AppState.darkMode));
    } catch (e) {
        console.error('상태 저장 실패:', e);
    }
}

// 상태 로드
function loadState() {
    try {
        const savedPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
        const savedBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
        const savedDarkMode = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
        
        if (savedPosts) {
            AppState.posts = JSON.parse(savedPosts).map(post => ({
                ...post,
                timestamp: new Date(post.timestamp),
                tags: post.tags || [],
                commentsList: post.commentsList || []
            }));
        }
        
        if (savedBookmarks) {
            AppState.bookmarks = new Set(JSON.parse(savedBookmarks));
        }
        
        if (savedDarkMode !== null) {
            AppState.darkMode = JSON.parse(savedDarkMode);
        }
    } catch (e) {
        console.error('상태 로드 실패:', e);
    }
}

// 상태 초기화 (게시글 데이터 삭제)
function clearPosts() {
    AppState.posts = [];
    AppState.filteredPosts = [];
    AppState.bookmarks = new Set();
    saveState();
}
