// 마이페이지 JavaScript

let currentSection = 'profile';

document.addEventListener('DOMContentLoaded', function() {
    // 로그인 체크
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        window.location.href = 'auth.html';
        return;
    }
    
    loadUserProfile();
    showSection('profile');
});

// 사용자 프로필 로드
function loadUserProfile() {
    document.getElementById('profileNickname').textContent = currentUser.nickname;
    document.getElementById('profileJoinDate').textContent = 
        '가입일: ' + formatDate(currentUser.joinDate).split(' ')[0];
    
    // 프로필 폼에 현재 정보 채우기
    document.getElementById('nickname').value = currentUser.nickname;
    document.getElementById('email').value = currentUser.email || '';
    document.getElementById('bio').value = currentUser.bio || '';
}

// 섹션 표시
function showSection(sectionId) {
    // 모든 섹션 숨기기
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 모든 네비게이션 링크에서 active 클래스 제거
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // 선택된 섹션 표시
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`a[href="#${sectionId}"]`).classList.add('active');
    
    currentSection = sectionId;
    
    // 섹션별 데이터 로드
    switch (sectionId) {
        case 'my-posts':
            loadMyPosts();
            break;
        case 'my-comments':
            loadMyComments();
            break;
        case 'bookmarks':
            loadBookmarks();
            break;
    }
}

// 내가 쓴 글 로드
function loadMyPosts() {
    const posts = getPosts().filter(post => post.authorId === currentUser.id);
    const container = document.getElementById('myPostsList');
    const countElement = document.getElementById('myPostCount');
    
    countElement.textContent = posts.length;
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>작성한 글이 없습니다</h3>
                <p>첫 번째 글을 작성해보세요!</p>
            </div>
        `;
        return;
    }
    
    // 최신순 정렬
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = posts.map(post => {
        const gallery = getGalleryById(post.galleryId);
        const galleryName = gallery ? gallery.name : '알 수 없음';
        const comments = getComments().filter(c => c.postId === post.id);
        
        return `
            <div class="post-item">
                <div class="item-title">
                    <a href="post.html?id=${post.id}">${escapeHtml(post.title)}</a>
                </div>
                <div class="item-meta">
                    <span class="gallery">${galleryName}</span>
                </div>
                <div class="item-stats">
                    <span>조회 ${post.views || 0}</span>
                    <span>추천 ${post.likes || 0}</span>
                    <span>댓글 ${comments.length}</span>
                </div>
                <div class="item-actions">
                    <button onclick="editMyPost('${post.id}')">수정</button>
                    <button onclick="deleteMyPost('${post.id}')" class="delete-btn">삭제</button>
                </div>
            </div>
        `;
    }).join('');
}

// 내가 쓴 댓글 로드
function loadMyComments() {
    const comments = getComments().filter(comment => comment.authorId === currentUser.id);
    const container = document.getElementById('myCommentsList');
    const countElement = document.getElementById('myCommentCount');
    
    countElement.textContent = comments.length;
    
    if (comments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>작성한 댓글이 없습니다</h3>
                <p>다양한 글에 댓글을 남겨보세요!</p>
            </div>
        `;
        return;
    }
    
    // 최신순 정렬
    comments.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = comments.map(comment => {
        const post = getPostById(comment.postId);
        const postTitle = post ? post.title : '삭제된 게시글';
        const gallery = post ? getGalleryById(post.galleryId) : null;
        const galleryName = gallery ? gallery.name : '알 수 없음';
        
        return `
            <div class="comment-item">
                <div class="item-title">
                    <a href="post.html?id=${comment.postId}">${escapeHtml(postTitle)}</a>
                </div>
                <div class="item-meta">
                    <span class="gallery">${galleryName}</span>
                </div>
                <div class="item-content">
                    ${truncateText(comment.content, 100)}
                </div>
                <div class="item-stats">
                    <span>추천 ${comment.likes || 0}</span>
                    <span>비추천 ${comment.dislikes || 0}</span>
                </div>
                <div class="item-actions">
                    <button onclick="deleteMyComment('${comment.id}')" class="delete-btn">삭제</button>
                </div>
            </div>
        `;
    }).join('');
}

// 북마크 로드
function loadBookmarks() {
    const container = document.getElementById('bookmarksList');
    const countElement = document.getElementById('bookmarkCount');
    
    if (!currentUser.bookmarks || currentUser.bookmarks.length === 0) {
        countElement.textContent = 0;
        container.innerHTML = `
            <div class="empty-state">
                <h3>북마크가 없습니다</h3>
                <p>마음에 드는 글을 북마크해보세요!</p>
            </div>
        `;
        return;
    }
    
    const posts = getPosts();
    const bookmarkedPosts = posts.filter(post => currentUser.bookmarks.includes(post.id));
    
    countElement.textContent = bookmarkedPosts.length;
    
    if (bookmarkedPosts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>북마크한 글들이 삭제되었습니다</h3>
                <p>새로운 글을 북마크해보세요!</p>
            </div>
        `;
        return;
    }
    
    // 최신순 정렬
    bookmarkedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = bookmarkedPosts.map(post => {
        const gallery = getGalleryById(post.galleryId);
        const galleryName = gallery ? gallery.name : '알 수 없음';
        const comments = getComments().filter(c => c.postId === post.id);
        
        return `
            <div class="post-item">
                <div class="item-title">
                    <a href="post.html?id=${post.id}">${escapeHtml(post.title)}</a>
                </div>
                <div class="item-meta">
                    <span class="gallery">${galleryName}</span>
                    <span class="author">${escapeHtml(post.author)}</span>
                </div>
                <div class="item-stats">
                    <span>조회 ${post.views || 0}</span>
                    <span>추천 ${post.likes || 0}</span>
                    <span>댓글 ${comments.length}</span>
                </div>
                <div class="item-actions">
                    <button onclick="removeBookmark('${post.id}')" class="delete-btn">북마크 제거</button>
                </div>
            </div>
        `;
    }).join('');
}

// 내 게시글 필터링
function filterMyPosts() {
    loadMyPosts(); // 간단한 구현, 실제로는 필터 적용
}

// 내 댓글 필터링
function filterMyComments() {
    loadMyComments(); // 간단한 구현, 실제로는 필터 적용
}

// 내 게시글 수정
function editMyPost(postId) {
    window.location.href = `write.html?edit=${postId}`;
}

// 내 게시글 삭제
function deleteMyPost(postId) {
    if (!confirm('게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        return;
    }
    
    deletePost(postId);
    loadMyPosts();
    showNotification('게시글이 삭제되었습니다.', 'success');
}

// 내 댓글 삭제
function deleteMyComment(commentId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) {
        return;
    }
    
    const comments = getComments();
    const filteredComments = comments.filter(comment => comment.id !== commentId);
    saveComments(filteredComments);
    
    loadMyComments();
    showNotification('댓글이 삭제되었습니다.', 'success');
}

// 닉네임 중복 확인
function checkNickname() {
    const nicknameInput = document.getElementById('nickname');
    const nickname = nicknameInput.value.trim();
    
    if (!nickname) {
        alert('닉네임을 입력해주세요.');
        return;
    }
    
    if (nickname === currentUser.nickname) {
        alert('현재 사용 중인 닉네임입니다.');
        return;
    }
    
    const users = getUsers();
    const existingUser = users.find(user => user.nickname === nickname);
    
    if (existingUser) {
        alert('이미 사용 중인 닉네임입니다.');
    } else {
        alert('사용 가능한 닉네임입니다.');
        nicknameInput.dataset.checked = 'true';
    }
}

// 프로필 업데이트
document.querySelector('.profile-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nickname = document.getElementById('nickname').value.trim();
    const email = document.getElementById('email').value.trim();
    const bio = document.getElementById('bio').value.trim();
    
    // 닉네임 변경 시 중복 확인 필요
    if (nickname !== currentUser.nickname && !document.getElementById('nickname').dataset.checked) {
        alert('닉네임 중복확인을 해주세요.');
        return;
    }
    
    // 사용자 정보 업데이트
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex] = {
            ...users[userIndex],
            nickname: nickname,
            email: email,
            bio: bio,
            updatedAt: new Date().toISOString()
        };
        
        saveUsers(users);
        
        // 현재 사용자 정보 업데이트
        currentUser = users[userIndex];
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        
        // UI 업데이트
        loadUserProfile();
        updateUserInterface();
        
        showNotification('프로필이 업데이트되었습니다.', 'success');
    }
});

// 비밀번호 변경
document.querySelector('.password-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
    if (currentPassword !== currentUser.password) {
        alert('현재 비밀번호가 올바르지 않습니다.');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('새 비밀번호는 6자 이상이어야 합니다.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('새 비밀번호가 일치하지 않습니다.');
        return;
    }
    
    // 비밀번호 업데이트
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        users[userIndex].passwordUpdatedAt = new Date().toISOString();
        
        saveUsers(users);
        
        // 현재 사용자 정보 업데이트
        currentUser = users[userIndex];
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        
        // 폼 초기화
        document.querySelector('.password-form').reset();
        
        showNotification('비밀번호가 변경되었습니다.', 'success');
    }
});

// 계정 삭제
function deleteAccount() {
    if (!confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        return;
    }
    
    const password = prompt('계정 삭제를 위해 비밀번호를 입력해주세요:');
    if (!password) {
        return;
    }
    
    if (password !== currentUser.password) {
        alert('비밀번호가 올바르지 않습니다.');
        return;
    }
    
    if (!confirm('마지막 확인입니다. 계정을 삭제하시겠습니까?')) {
        return;
    }
    
    // 사용자 데이터 삭제
    const users = getUsers();
    const filteredUsers = users.filter(user => user.id !== currentUser.id);
    saveUsers(filteredUsers);
    
    // 현재 세션 정리
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    
    alert('계정이 삭제되었습니다.');
    window.location.href = 'index.html';
}

// 알림 표시
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 설정 저장
function saveSettings() {
    const commentNotification = document.getElementById('commentNotification').checked;
    const likeNotification = document.getElementById('likeNotification').checked;
    const systemNotification = document.getElementById('systemNotification').checked;
    
    // 사용자 설정 업데이트
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].settings = {
            commentNotification,
            likeNotification,
            systemNotification
        };
        
        saveUsers(users);
        currentUser = users[userIndex];
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        
        showNotification('설정이 저장되었습니다.', 'success');
    }
}

// 알림 설정 자동 저장
document.addEventListener('change', function(e) {
    if (e.target.type === 'checkbox' && e.target.closest('.checkbox-group')) {
        saveSettings();
    }
});

// 북마크 제거
function removeBookmark(postId) {
    if (!confirm('북마크를 제거하시겠습니까?')) {
        return;
    }
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].bookmarks = users[userIndex].bookmarks.filter(id => id !== postId);
        saveUsers(users);
        
        currentUser = users[userIndex];
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        
        loadBookmarks();
        showNotification('북마크에서 제거되었습니다.', 'info');
    }
}

// 전역 함수 등록
window.showSection = showSection;
window.filterMyPosts = filterMyPosts;
window.filterMyComments = filterMyComments;
window.editMyPost = editMyPost;
window.deleteMyPost = deleteMyPost;
window.deleteMyComment = deleteMyComment;
window.checkNickname = checkNickname;
window.deleteAccount = deleteAccount;
window.removeBookmark = removeBookmark;
