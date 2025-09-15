// 관리자 페이지 JavaScript

let currentAdminSection = 'dashboard';

document.addEventListener('DOMContentLoaded', function() {
    // 관리자 권한 확인
    if (!checkAdminAccess()) {
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Hamilton 계정인지 확인
    if (currentUser.id !== 'lewishamilton44') {
        showNotification('이 관리자 패널은 Hamilton 계정 전용입니다.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        return;
    }
    
    showAdminSection('dashboard');
    
    // 환영 메시지
    showNotification(`환영합니다, ${currentUser.nickname}님! 관리자 패널에 접속하셨습니다.`, 'success', 4000);
});

// 관리자 섹션 표시
function showAdminSection(sectionId) {
    // 모든 섹션 숨기기
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 모든 네비게이션 링크에서 active 클래스 제거
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // 선택된 섹션 표시
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`a[href="#${sectionId}"]`).classList.add('active');
    
    currentAdminSection = sectionId;
    
    // 섹션별 데이터 로드
    switch (sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'posts':
            loadAdminPosts();
            break;
        case 'comments':
            loadAdminComments();
            break;
        case 'galleries':
            loadAdminGalleries();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

// 대시보드 로드
function loadDashboard() {
    const users = getUsers();
    const posts = getPosts();
    const comments = getComments();
    const galleries = getGalleries();
    
    // 통계 업데이트
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalPosts').textContent = posts.length;
    document.getElementById('totalComments').textContent = comments.length;
    document.getElementById('totalGalleries').textContent = galleries.length;
    
    // 최근 활동 로드
    loadRecentActivity();
}

// 최근 활동 로드
function loadRecentActivity() {
    const users = getUsers();
    const posts = getPosts();
    const comments = getComments();
    
    const activities = [];
    
    // 최근 가입 사용자
    users.slice(-5).forEach(user => {
        activities.push({
            type: 'user',
            icon: '👤',
            text: `${user.nickname}님이 가입했습니다`,
            time: user.joinDate
        });
    });
    
    // 최근 게시글
    posts.slice(-5).forEach(post => {
        activities.push({
            type: 'post',
            icon: '📝',
            text: `${post.author}님이 "${truncateText(post.title, 30)}" 게시글을 작성했습니다`,
            time: post.date
        });
    });
    
    // 최근 댓글
    comments.slice(-5).forEach(comment => {
        const post = getPostById(comment.postId);
        activities.push({
            type: 'comment',
            icon: '💬',
            text: `${comment.author}님이 "${truncateText(post?.title || '삭제된 게시글', 20)}"에 댓글을 작성했습니다`,
            time: comment.date
        });
    });
    
    // 시간순 정렬
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    const container = document.getElementById('recentActivity');
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="empty-admin-state">
                <h3>최근 활동이 없습니다</h3>
                <p>사용자 활동이 시작되면 여기에 표시됩니다.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activities.slice(0, 10).map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                ${activity.icon}
            </div>
            <div class="activity-content">
                <div class="activity-text">${activity.text}</div>
                <div class="activity-time">${timeAgo(activity.time)}</div>
            </div>
        </div>
    `).join('');
}

// 사용자 관리 로드
function loadUsers() {
    const users = getUsers();
    const container = document.getElementById('usersList');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-admin-state">
                <h3>등록된 사용자가 없습니다</h3>
            </div>
        `;
        return;
    }
    
    // 사용자 목록 테이블 생성
    container.innerHTML = `
        <div class="admin-table-container">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>아바타</th>
                        <th>아이디</th>
                        <th>닉네임</th>
                        <th>이메일</th>
                        <th>가입일</th>
                        <th>최근 로그인</th>
                        <th>권한</th>
                        <th>상태</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>
                                <div class="user-avatar ${user.isAdmin ? 'admin' : ''}">
                                    ${user.nickname.charAt(0).toUpperCase()}
                                </div>
                            </td>
                            <td>${escapeHtml(user.id)}</td>
                            <td>${escapeHtml(user.nickname)}</td>
                            <td>${escapeHtml(user.email || '-')}</td>
                            <td>${formatDate(user.joinDate).split(' ')[0]}</td>
                            <td>${user.lastLogin ? timeAgo(user.lastLogin) : '없음'}</td>
                            <td>
                                <span class="status-badge ${user.isAdmin ? 'status-active' : 'status-inactive'}">
                                    ${user.isAdmin ? '관리자' : '일반'}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">
                                    ${user.isActive ? '활성' : '비활성'}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button onclick="viewUserPosts('${user.id}')">게시글</button>
                                    <button onclick="viewUserComments('${user.id}')">댓글</button>
                                    ${user.id === 'lewishamilton44' ? '<span class="status-badge status-active">최고관리자</span>' : 
                                      user.id !== 'admin' ? `<button onclick="toggleUserAdmin('${user.id}')" class="btn-warning">${user.isAdmin ? '일반화' : '관리자화'}</button>` : ''}
                                    ${user.id === 'lewishamilton44' ? '' : 
                                      user.id !== 'admin' ? `<button onclick="deleteUser('${user.id}')" class="btn-danger">삭제</button>` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <!-- 모바일 카드 레이아웃 -->
            <div class="mobile-cards">
                ${users.map(user => `
                    <div class="mobile-card">
                        <div class="mobile-card-header">
                            <div class="mobile-card-user">
                                <div class="user-avatar ${user.isAdmin ? 'admin' : ''}">
                                    ${user.nickname.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div class="mobile-card-name">${escapeHtml(user.nickname)}</div>
                                    <span class="status-badge ${user.isAdmin ? 'status-active' : 'status-inactive'}">
                                        ${user.isAdmin ? '관리자' : '일반'}
                                    </span>
                                </div>
                            </div>
                            <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">
                                ${user.isActive ? '활성' : '비활성'}
                            </span>
                        </div>
                        
                        <div class="mobile-card-content">
                            <div class="mobile-card-field">
                                <div class="mobile-card-label">아이디</div>
                                <div class="mobile-card-value">${escapeHtml(user.id)}</div>
                            </div>
                            <div class="mobile-card-field">
                                <div class="mobile-card-label">이메일</div>
                                <div class="mobile-card-value">${escapeHtml(user.email || '-')}</div>
                            </div>
                            <div class="mobile-card-field">
                                <div class="mobile-card-label">가입일</div>
                                <div class="mobile-card-value">${formatDate(user.joinDate).split(' ')[0]}</div>
                            </div>
                            <div class="mobile-card-field">
                                <div class="mobile-card-label">최근 로그인</div>
                                <div class="mobile-card-value">${user.lastLogin ? timeAgo(user.lastLogin) : '없음'}</div>
                            </div>
                        </div>
                        
                        <div class="mobile-card-actions">
                            <button onclick="viewUserPosts('${user.id}')" class="btn-primary">게시글</button>
                            <button onclick="viewUserComments('${user.id}')" class="btn-primary">댓글</button>
                            ${user.id === 'lewishamilton44' ? '<span class="status-badge status-active">최고관리자</span>' : 
                              user.id !== 'admin' ? `<button onclick="toggleUserAdmin('${user.id}')" class="btn-warning">${user.isAdmin ? '일반화' : '관리자화'}</button>` : ''}
                            ${user.id === 'lewishamilton44' ? '' : 
                              user.id !== 'admin' ? `<button onclick="deleteUser('${user.id}')" class="btn-danger">삭제</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// 게시글 관리 로드
function loadAdminPosts() {
    const posts = getPosts();
    const container = document.getElementById('postsList');
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="empty-admin-state">
                <h3>등록된 게시글이 없습니다</h3>
            </div>
        `;
        return;
    }
    
    // 최신순 정렬
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = `
        <div class="admin-table-container">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>번호</th>
                        <th>제목</th>
                        <th>갤러리</th>
                        <th>작성자</th>
                        <th>작성일</th>
                        <th>조회수</th>
                        <th>추천</th>
                        <th>댓글</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
                    ${posts.map((post, index) => {
                        const gallery = getGalleryById(post.galleryId);
                        const comments = getComments().filter(c => c.postId === post.id);
                        
                        return `
                            <tr>
                                <td>${posts.length - index}</td>
                                <td>
                                    <a href="post.html?id=${post.id}" target="_blank">
                                        ${escapeHtml(truncateText(post.title, 50))}
                                    </a>
                                    ${post.type === 'notice' ? '<span class="status-badge status-active">공지</span>' : ''}
                                </td>
                                <td>${gallery ? gallery.name : '삭제된 갤러리'}</td>
                                <td>${escapeHtml(post.author)}</td>
                                <td>${timeAgo(post.date)}</td>
                                <td>${post.views || 0}</td>
                                <td>${post.likes || 0}</td>
                                <td>${comments.length}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button onclick="togglePostNotice('${post.id}')" class="btn-warning">
                                            ${post.type === 'notice' ? '공지해제' : '공지'}
                                        </button>
                                        <button onclick="deleteAdminPost('${post.id}')" class="btn-danger">삭제</button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            
            <!-- 모바일 카드 레이아웃 -->
            <div class="mobile-cards">
                ${posts.map((post, index) => {
                    const gallery = getGalleryById(post.galleryId);
                    const comments = getComments().filter(c => c.postId === post.id);
                    
                    return `
                        <div class="mobile-card">
                            <div class="mobile-card-header">
                                <div class="mobile-card-user">
                                    <div class="mobile-card-name">
                                        <a href="post.html?id=${post.id}" target="_blank" style="color: var(--text-primary); text-decoration: none;">
                                            ${escapeHtml(truncateText(post.title, 40))}
                                        </a>
                                    </div>
                                    ${post.type === 'notice' ? '<span class="status-badge status-notice">공지</span>' : ''}
                                </div>
                                <div class="mobile-card-name">#${posts.length - index}</div>
                            </div>
                            
                            <div class="mobile-card-content">
                                <div class="mobile-card-field">
                                    <div class="mobile-card-label">갤러리</div>
                                    <div class="mobile-card-value">${gallery ? gallery.name : '삭제된 갤러리'}</div>
                                </div>
                                <div class="mobile-card-field">
                                    <div class="mobile-card-label">작성자</div>
                                    <div class="mobile-card-value">${escapeHtml(post.author)}</div>
                                </div>
                                <div class="mobile-card-field">
                                    <div class="mobile-card-label">작성일</div>
                                    <div class="mobile-card-value">${timeAgo(post.date)}</div>
                                </div>
                                <div class="mobile-card-field">
                                    <div class="mobile-card-label">조회/추천/댓글</div>
                                    <div class="mobile-card-value">${post.views || 0}/${post.likes || 0}/${comments.length}</div>
                                </div>
                            </div>
                            
                            <div class="mobile-card-actions">
                                <button onclick="togglePostNotice('${post.id}')" class="btn-warning">
                                    ${post.type === 'notice' ? '공지해제' : '공지'}
                                </button>
                                <button onclick="deleteAdminPost('${post.id}')" class="btn-danger">삭제</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// 댓글 관리 로드
function loadAdminComments() {
    const comments = getComments();
    const container = document.getElementById('commentsList');
    
    if (comments.length === 0) {
        container.innerHTML = `
            <div class="empty-admin-state">
                <h3>등록된 댓글이 없습니다</h3>
            </div>
        `;
        return;
    }
    
    // 최신순 정렬
    comments.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = `
        <div class="admin-table-container">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>내용</th>
                        <th>게시글</th>
                        <th>작성자</th>
                        <th>작성일</th>
                        <th>추천</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
                    ${comments.map(comment => {
                        const post = getPostById(comment.postId);
                        
                        return `
                            <tr>
                                <td>${escapeHtml(truncateText(comment.content, 100))}</td>
                                <td>
                                    ${post ? `<a href="post.html?id=${post.id}" target="_blank">${escapeHtml(truncateText(post.title, 30))}</a>` : '삭제된 게시글'}
                                </td>
                                <td>${escapeHtml(comment.author)}</td>
                                <td>${timeAgo(comment.date)}</td>
                                <td>${comment.likes || 0}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button onclick="deleteAdminComment('${comment.id}')" class="btn-danger">삭제</button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            
            <!-- 모바일 카드 레이아웃 -->
            <div class="mobile-cards">
                ${comments.map(comment => {
                    const post = getPostById(comment.postId);
                    
                    return `
                        <div class="mobile-card">
                            <div class="mobile-card-header">
                                <div class="mobile-card-user">
                                    <div class="mobile-card-name">${escapeHtml(comment.author)}</div>
                                    <span class="status-badge status-active">댓글</span>
                                </div>
                                <div class="mobile-card-name">👍 ${comment.likes || 0}</div>
                            </div>
                            
                            <div class="mobile-card-content">
                                <div class="mobile-card-field" style="grid-column: 1 / -1;">
                                    <div class="mobile-card-label">댓글 내용</div>
                                    <div class="mobile-card-value">${escapeHtml(truncateText(comment.content, 150))}</div>
                                </div>
                                <div class="mobile-card-field">
                                    <div class="mobile-card-label">게시글</div>
                                    <div class="mobile-card-value">
                                        ${post ? `<a href="post.html?id=${post.id}" target="_blank" style="color: var(--accent-color);">${escapeHtml(truncateText(post.title, 30))}</a>` : '삭제된 게시글'}
                                    </div>
                                </div>
                                <div class="mobile-card-field">
                                    <div class="mobile-card-label">작성일</div>
                                    <div class="mobile-card-value">${timeAgo(comment.date)}</div>
                                </div>
                            </div>
                            
                            <div class="mobile-card-actions">
                                <button onclick="deleteAdminComment('${comment.id}')" class="btn-danger">삭제</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// 갤러리 관리 로드
function loadAdminGalleries() {
    const galleries = getGalleries();
    const container = document.getElementById('galleriesList');
    
    container.innerHTML = `
        <div class="admin-table-container">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>이름</th>
                        <th>설명</th>
                        <th>게시글 수</th>
                        <th>오늘 게시글</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
                    ${galleries.map(gallery => `
                        <tr>
                            <td>${escapeHtml(gallery.id)}</td>
                            <td>
                                <a href="gallery.html?id=${gallery.id}" target="_blank">
                                    ${escapeHtml(gallery.name)}
                                </a>
                            </td>
                            <td>${escapeHtml(gallery.description || '-')}</td>
                            <td>${gallery.postCount || 0}</td>
                            <td>${gallery.todayPostCount || 0}</td>
                            <td>
                                <div class="action-buttons">
                                    <button onclick="editGallery('${gallery.id}')">수정</button>
                                    <button onclick="deleteGallery('${gallery.id}')" class="btn-danger">삭제</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <!-- 모바일 카드 레이아웃 -->
            <div class="mobile-cards">
                ${galleries.map(gallery => `
                    <div class="mobile-card">
                        <div class="mobile-card-header">
                            <div class="mobile-card-user">
                                <div class="mobile-card-name">
                                    <a href="gallery.html?id=${gallery.id}" target="_blank" style="color: var(--text-primary); text-decoration: none;">
                                        ${escapeHtml(gallery.name)}
                                    </a>
                                </div>
                                <span class="status-badge status-active">갤러리</span>
                            </div>
                            <div class="mobile-card-name">${escapeHtml(gallery.id)}</div>
                        </div>
                        
                        <div class="mobile-card-content">
                            <div class="mobile-card-field" style="grid-column: 1 / -1;">
                                <div class="mobile-card-label">설명</div>
                                <div class="mobile-card-value">${escapeHtml(gallery.description || '설명 없음')}</div>
                            </div>
                            <div class="mobile-card-field">
                                <div class="mobile-card-label">총 게시글</div>
                                <div class="mobile-card-value">${gallery.postCount || 0}개</div>
                            </div>
                            <div class="mobile-card-field">
                                <div class="mobile-card-label">오늘 게시글</div>
                                <div class="mobile-card-value">${gallery.todayPostCount || 0}개</div>
                            </div>
                        </div>
                        
                        <div class="mobile-card-actions">
                            <button onclick="editGallery('${gallery.id}')" class="btn-primary">수정</button>
                            <button onclick="deleteGallery('${gallery.id}')" class="btn-danger">삭제</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// 신고 관리 로드
function loadReports() {
    const container = document.getElementById('reportsList');
    
    // 신고 시스템이 구현되면 여기에 로드
    container.innerHTML = `
        <div class="empty-admin-state">
            <h3>신고된 내용이 없습니다</h3>
            <p>신고 시스템이 구현되면 여기에 표시됩니다.</p>
        </div>
    `;
}

// 사용자 관리 함수들
function toggleUserAdmin(userId) {
    if (!canManageUsers()) {
        showNotification('사용자 관리 권한이 없습니다.', 'error');
        return;
    }
    
    // Hamilton 계정은 변경할 수 없음
    if (userId === 'lewishamilton44') {
        showNotification('Hamilton 계정의 권한은 변경할 수 없습니다.', 'warning');
        return;
    }
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        users[userIndex].isAdmin = !users[userIndex].isAdmin;
        
        // 일반 관리자 권한 부여 시 기본 권한 설정
        if (users[userIndex].isAdmin) {
            users[userIndex].role = 'admin';
            users[userIndex].permissions = ['manage_posts', 'manage_comments'];
        } else {
            delete users[userIndex].role;
            delete users[userIndex].permissions;
        }
        
        saveUsers(users);
        loadUsers();
        showNotification(`사용자 권한이 변경되었습니다.`, 'success');
    }
}

function deleteUser(userId) {
    if (!canManageUsers()) {
        showNotification('사용자 관리 권한이 없습니다.', 'error');
        return;
    }
    
    // Hamilton 계정은 삭제할 수 없음
    if (userId === 'lewishamilton44') {
        showNotification('Hamilton 계정은 삭제할 수 없습니다.', 'error');
        return;
    }
    
    if (!confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
        return;
    }
    
    const users = getUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    saveUsers(filteredUsers);
    
    loadUsers();
    showNotification('사용자가 삭제되었습니다.', 'success');
}

function viewUserPosts(userId) {
    // 사용자의 게시글만 필터링해서 보여주기
    showAdminSection('posts');
    // TODO: 필터링 구현
}

function viewUserComments(userId) {
    // 사용자의 댓글만 필터링해서 보여주기
    showAdminSection('comments');
    // TODO: 필터링 구현
}

// 게시글 관리 함수들
function togglePostNotice(postId) {
    if (!canManagePosts()) {
        showNotification('게시글 관리 권한이 없습니다.', 'error');
        return;
    }
    
    const posts = getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1) {
        posts[postIndex].type = posts[postIndex].type === 'notice' ? 'normal' : 'notice';
        posts[postIndex].lastModified = new Date().toISOString();
        posts[postIndex].modifiedBy = currentUser.nickname;
        
        savePosts(posts);
        loadAdminPosts();
        showNotification('게시글 상태가 변경되었습니다.', 'success');
    }
}

function deleteAdminPost(postId) {
    if (!canManagePosts()) {
        showNotification('게시글 관리 권한이 없습니다.', 'error');
        return;
    }
    
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        return;
    }
    
    deletePost(postId);
    loadAdminPosts();
    showNotification('게시글이 삭제되었습니다.', 'success');
}

// 댓글 관리 함수들
function deleteAdminComment(commentId) {
    if (!canManageComments()) {
        showNotification('댓글 관리 권한이 없습니다.', 'error');
        return;
    }
    
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
        return;
    }
    
    const comments = getComments();
    const filteredComments = comments.filter(c => c.id !== commentId);
    saveComments(filteredComments);
    
    loadAdminComments();
    showNotification('댓글이 삭제되었습니다.', 'success');
}

// 갤러리 관리 함수들
function showAddGalleryModal() {
    if (!canManageGalleries()) {
        showNotification('갤러리 관리 권한이 없습니다.', 'error');
        return;
    }
    document.getElementById('addGalleryModal').style.display = 'flex';
}

function closeAddGalleryModal() {
    document.getElementById('addGalleryModal').style.display = 'none';
    document.getElementById('addGalleryForm').reset();
}

function addGallery(event) {
    event.preventDefault();
    
    if (!canManageGalleries()) {
        showNotification('갤러리 관리 권한이 없습니다.', 'error');
        return;
    }
    
    const formData = new FormData(event.target);
    const id = formData.get('id').trim();
    const name = formData.get('name').trim();
    const description = formData.get('description').trim();
    
    // 유효성 검사
    if (!id || !name) {
        showNotification('ID와 이름은 필수입니다.', 'error');
        return;
    }
    
    // ID 중복 확인
    const galleries = getGalleries();
    if (galleries.find(g => g.id === id)) {
        showNotification('이미 존재하는 갤러리 ID입니다.', 'error');
        return;
    }
    
    // 새 갤러리 추가
    const newGallery = {
        id: id,
        name: name,
        description: description,
        postCount: 0,
        todayPostCount: 0,
        createdBy: currentUser.nickname,
        createdAt: new Date().toISOString()
    };
    
    galleries.push(newGallery);
    saveGalleries(galleries);
    
    closeAddGalleryModal();
    loadAdminGalleries();
    showNotification('새 갤러리가 추가되었습니다.', 'success');
}

function editGallery(galleryId) {
    if (!canManageGalleries()) {
        showNotification('갤러리 관리 권한이 없습니다.', 'error');
        return;
    }
    // TODO: 갤러리 수정 모달 구현
    showNotification('갤러리 수정 기능은 준비 중입니다.', 'info');
}

function deleteGallery(galleryId) {
    if (!canManageGalleries()) {
        showNotification('갤러리 관리 권한이 없습니다.', 'error');
        return;
    }
    
    // 기본 갤러리는 삭제할 수 없음
    const defaultGalleries = ['humor', 'free', 'news', 'tech', 'game'];
    if (defaultGalleries.includes(galleryId)) {
        showNotification('기본 갤러리는 삭제할 수 없습니다.', 'warning');
        return;
    }
    
    if (!confirm('정말로 이 갤러리를 삭제하시겠습니까? 관련된 모든 게시글도 삭제됩니다.')) {
        return;
    }
    
    // 갤러리 삭제
    const galleries = getGalleries();
    const filteredGalleries = galleries.filter(g => g.id !== galleryId);
    saveGalleries(filteredGalleries);
    
    // 관련 게시글도 삭제
    const posts = getPosts();
    const filteredPosts = posts.filter(p => p.galleryId !== galleryId);
    savePosts(filteredPosts);
    
    loadAdminGalleries();
    showNotification('갤러리와 관련 게시글이 삭제되었습니다.', 'success');
}

// 검색 함수들
function searchUsers() {
    // TODO: 사용자 검색 구현
}

function searchPosts() {
    // TODO: 게시글 검색 구현
}

function searchComments() {
    // TODO: 댓글 검색 구현
}

// 필터 함수들
function filterUsers() {
    // TODO: 사용자 필터 구현
}

function filterPosts() {
    // TODO: 게시글 필터 구현
}

function filterComments() {
    // TODO: 댓글 필터 구현
}

function filterReports() {
    // TODO: 신고 필터 구현
}

// 전역 함수 등록
window.showAdminSection = showAdminSection;
window.toggleUserAdmin = toggleUserAdmin;
window.deleteUser = deleteUser;
window.viewUserPosts = viewUserPosts;
window.viewUserComments = viewUserComments;
window.togglePostNotice = togglePostNotice;
window.deleteAdminPost = deleteAdminPost;
window.deleteAdminComment = deleteAdminComment;
window.showAddGalleryModal = showAddGalleryModal;
window.closeAddGalleryModal = closeAddGalleryModal;
window.addGallery = addGallery;
window.editGallery = editGallery;
window.deleteGallery = deleteGallery;
window.searchUsers = searchUsers;
window.searchPosts = searchPosts;
window.searchComments = searchComments;
window.filterUsers = filterUsers;
window.filterPosts = filterPosts;
window.filterComments = filterComments;
window.filterReports = filterReports;
