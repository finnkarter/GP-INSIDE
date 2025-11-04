// 인증 관련 함수들

// 현재 로그인된 사용자 정보
let currentUser = null;

// 사용자 데이터 (실제로는 서버에 저장되어야 함)
const USERS_KEY = 'gp_inside_users';
const CURRENT_USER_KEY = 'gp_inside_current_user';

// 사용자 초기화
function initAuth() {
    loadCurrentUser();
    updateAuthUI();
}

// 현재 사용자 로드
function loadCurrentUser() {
    try {
        const savedUser = localStorage.getItem(CURRENT_USER_KEY);
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
        }
    } catch (e) {
        console.error('사용자 로드 실패:', e);
    }
}

// 현재 사용자 저장
function saveCurrentUser() {
    try {
        if (currentUser) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
        } else {
            localStorage.removeItem(CURRENT_USER_KEY);
        }
    } catch (e) {
        console.error('사용자 저장 실패:', e);
    }
}

// 모든 사용자 로드
function loadUsers() {
    try {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : {};
    } catch (e) {
        console.error('사용자 목록 로드 실패:', e);
        return {};
    }
}

// 모든 사용자 저장
function saveUsers(users) {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
        console.error('사용자 목록 저장 실패:', e);
    }
}

// 회원가입
function register(username, password, nickname) {
    if (!username || !password || !nickname) {
        showNotification('모든 필드를 입력해주세요.', 'warning');
        return false;
    }
    
    if (username.length < 4) {
        showNotification('아이디는 4자 이상이어야 합니다.', 'warning');
        return false;
    }
    
    if (password.length < 6) {
        showNotification('비밀번호는 6자 이상이어야 합니다.', 'warning');
        return false;
    }
    
    const users = loadUsers();
    
    if (users[username]) {
        showNotification('이미 존재하는 아이디입니다.', 'error');
        return false;
    }
    
    // 새 사용자 생성
    users[username] = {
        username: username,
        password: password, // 실제로는 해시화해야 함
        nickname: nickname,
        avatar: nickname[0],
        createdAt: new Date().toISOString(),
        posts: 0,
        comments: 0,
        likes: 0
    };
    
    saveUsers(users);
    showNotification('회원가입이 완료되었습니다!', 'success');
    return true;
}

// 로그인
function login(username, password) {
    if (!username || !password) {
        showNotification('아이디와 비밀번호를 입력해주세요.', 'warning');
        return false;
    }
    
    const users = loadUsers();
    const user = users[username];
    
    if (!user) {
        showNotification('존재하지 않는 아이디입니다.', 'error');
        return false;
    }
    
    if (user.password !== password) {
        showNotification('비밀번호가 일치하지 않습니다.', 'error');
        return false;
    }
    
    // 로그인 성공
    currentUser = {
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        posts: user.posts || 0,
        comments: user.comments || 0,
        likes: user.likes || 0
    };
    
    saveCurrentUser();
    updateAuthUI();
    showNotification(`${currentUser.nickname}님, 환영합니다!`, 'success');
    
    return true;
}

// 로그아웃
function logout() {
    if (!showConfirm('로그아웃 하시겠습니까?')) {
        return;
    }
    
    currentUser = null;
    saveCurrentUser();
    updateAuthUI();
    showNotification('로그아웃되었습니다.', 'info');
}

// 인증 UI 업데이트
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    
    if (currentUser) {
        // 로그인 상태
        loginBtn.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'flex';
            userInfo.innerHTML = `
                <div class="user-profile">
                    <div class="user-avatar" style="background: ${getRandomColor()}">${currentUser.avatar}</div>
                    <span class="user-nickname">${currentUser.nickname}</span>
                </div>
                <button class="btn-secondary" onclick="logout()">로그아웃</button>
            `;
        }
    } else {
        // 로그아웃 상태
        loginBtn.style.display = 'block';
        if (userInfo) {
            userInfo.style.display = 'none';
        }
    }
}

// 로그인 여부 확인
function isLoggedIn() {
    return currentUser !== null;
}

// 현재 사용자 정보 가져오기
function getCurrentUser() {
    return currentUser;
}

// 사용자 통계 업데이트
function updateUserStats(type) {
    if (!currentUser) return;
    
    const users = loadUsers();
    const user = users[currentUser.username];
    
    if (user) {
        if (type === 'post') {
            user.posts = (user.posts || 0) + 1;
            currentUser.posts = user.posts;
        } else if (type === 'comment') {
            user.comments = (user.comments || 0) + 1;
            currentUser.comments = user.comments;
        } else if (type === 'like') {
            user.likes = (user.likes || 0) + 1;
            currentUser.likes = user.likes;
        }
        
        saveUsers(users);
        saveCurrentUser();
    }
}
