// GP-Inside 메인 애플리케이션 (모듈화 버전)
class GPInside {
    constructor() {
        // 모듈 초기화
        this.authManager = new AuthManager();
        this.galleryManager = new GalleryManager(this.authManager);
        this.postManager = new PostManager(this.authManager, this.galleryManager);
        this.adminManager = new AdminManager(this.authManager, this.galleryManager, this.postManager);
        this.themeManager = new ThemeManager();
        
        // 상태 관리
        this.currentView = 'galleries';
        this.currentPostId = null;
        this.sortBy = 'latest';
        this.searchTerm = '';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUserUI();
        this.switchView('galleries');
    }

    // 이벤트 바인딩
    bindEvents() {
        // 네비게이션
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        document.querySelectorAll('.auth-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // 폼 이벤트
        document.getElementById('post-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createPost();
        });

        document.getElementById('comment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createComment();
        });

        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        document.getElementById('gallery-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createGallery();
        });

        // 검색 및 정렬
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.renderPosts();
        });

        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.renderPosts();
        });

        document.getElementById('gallery-search').addEventListener('input', (e) => {
            this.renderGalleries(e.target.value.toLowerCase());
        });
    }

    // 뷰 전환
    switchView(view) {
        // 네비게이션 업데이트
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // 뷰 업데이트
        document.querySelectorAll('.view').forEach(v => {
            v.classList.toggle('active', v.id === `${view}-view`);
        });

        this.currentView = view;

        // 뷰별 초기화
        if (view === 'galleries') {
            this.renderGalleries();
        } else if (view === 'home') {
            this.renderPosts();
        } else if (view === 'stats') {
            this.updateStats();
        } else if (view === 'write') {
            this.clearForm();
        } else if (view === 'admin') {
            this.renderAdminPanel();
        }
    }

    // 사용자 UI 업데이트
    updateUserUI() {
        const userInfo = document.getElementById('user-info');
        const authButtons = document.getElementById('auth-buttons');
        const createGalleryBtn = document.getElementById('create-gallery-btn');
        const adminNavBtn = document.querySelector('[data-view="admin"]');

        if (this.authManager.isLoggedIn()) {
            userInfo.style.display = 'flex';
            authButtons.style.display = 'none';
            document.getElementById('user-nickname').textContent = this.authManager.getCurrentUser().nickname;
            
            // 관리자만 갤러리 생성 가능
            if (createGalleryBtn) {
                createGalleryBtn.style.display = this.authManager.isAdmin() ? 'inline-block' : 'none';
            }
            
            // 관리자 메뉴 표시
            if (adminNavBtn) {
                adminNavBtn.style.display = this.authManager.isAdmin() ? 'inline-block' : 'none';
            }
        } else {
            userInfo.style.display = 'none';
            authButtons.style.display = 'flex';
            
            if (createGalleryBtn) {
                createGalleryBtn.style.display = 'none';
            }
            
            if (adminNavBtn) {
                adminNavBtn.style.display = 'none';
            }
        }
    }

    // 회원가입
    register() {
        try {
            const username = document.getElementById('register-username').value.trim();
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm').value;
            const nickname = document.getElementById('register-nickname').value.trim();

            this.authManager.register(username, password, confirmPassword, nickname);
            alert('회원가입이 완료되었습니다!');
            this.switchView('login');
        } catch (error) {
            alert(error.message);
        }
    }

    // 로그인
    login() {
        try {
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;

            const user = this.authManager.login(username, password);
            this.updateUserUI();
            this.switchView('galleries');
            
            if (user.isAdmin) {
                alert(`${user.nickname}님, 환영합니다! (관리자)`);
            } else {
                alert(`${user.nickname}님, 환영합니다!`);
            }
        } catch (error) {
            alert(error.message);
        }
    }

    // 로그아웃
    logout() {
        this.authManager.logout();
        this.updateUserUI();
        this.switchView('galleries');
        alert('로그아웃 되었습니다.');
    }

    // 갤러리 생성 (관리자 전용)
    createGallery() {
        try {
            const name = document.getElementById('gallery-name').value.trim();
            const description = document.getElementById('gallery-description').value.trim();

            this.galleryManager.createGallery(name, description);
            alert('갤러리가 생성되었습니다!');
            this.switchView('galleries');
        } catch (error) {
            alert(error.message);
        }
    }

    // 갤러리 표시
    showCreateGallery() {
        if (!this.authManager.isAdmin()) {
            alert('갤러리 생성은 관리자만 가능합니다.');
            return;
        }
        this.switchView('create-gallery');
    }

    // 갤러리 목록 렌더링
    renderGalleries(searchTerm = '') {
        const container = document.getElementById('galleries-container');
        const galleries = searchTerm ? 
            this.galleryManager.searchGalleries(searchTerm) : 
            this.galleryManager.getAllGalleries();

        if (galleries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>갤러리가 없습니다</h3>
                    <p>${this.authManager.isAdmin() ? '첫 번째 갤러리를 만들어보세요!' : '관리자가 갤러리를 생성할 때까지 기다려주세요.'}</p>
                </div>
            `;
            return;
        }

        // 최근 활동순 정렬
        galleries.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

        container.innerHTML = galleries.map(gallery => {
            return `
                <div class="gallery-card fade-in" onclick="app.enterGallery('${gallery.id}')">
                    <h3>${this.escapeHtml(gallery.name)}</h3>
                    <p>${this.escapeHtml(gallery.description)}</p>
                    <div class="gallery-stats">
                        <span>게시글 ${gallery.postCount}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 갤러리 입장
    enterGallery(galleryId) {
        const gallery = this.galleryManager.setCurrentGallery(galleryId);
        if (!gallery) return;

        document.getElementById('current-gallery-name').textContent = gallery.name;
        this.switchView('home');
        this.renderPosts();
    }

    // 게시글 생성
    createPost() {
        try {
            const title = document.getElementById('post-title').value.trim();
            const author = document.getElementById('post-author').value.trim();
            const content = document.getElementById('post-content').value.trim();
            const galleryId = this.galleryManager.getCurrentGallery()?.id || 'free';

            const post = this.postManager.createPost(title, author, content, galleryId);
            this.switchView('home');
            this.showPost(post.id);
        } catch (error) {
            alert(error.message);
        }
    }

    // 게시글 표시
    renderPosts() {
        const container = document.getElementById('posts-container');
        const currentGallery = this.galleryManager.getCurrentGallery();
        const galleryId = currentGallery ? currentGallery.id : 'free';
        
        let posts = this.postManager.searchPosts(galleryId, this.searchTerm);
        posts = this.postManager.sortPosts(posts, this.sortBy);

        if (posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>게시글이 없습니다</h3>
                    <p>첫 번째 게시글을 작성해보세요!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = posts.map(post => {
            const commentCount = this.postManager.getComments(post.id).length;
            const userBadge = post.isUserPost ? '🔸' : '';
            
            return `
                <div class="post-item fade-in" onclick="app.showPost('${post.id}')">
                    <h3 class="post-title">${userBadge} ${this.escapeHtml(post.title)}</h3>
                    <div class="post-meta">
                        <span>작성자: ${this.escapeHtml(post.author)}</span>
                        <div class="post-stats">
                            <span>조회 ${post.views}</span>
                            <span>댓글 ${commentCount}</span>
                            <span>좋아요 ${post.likes}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 게시글 상세 보기
    showPost(postId) {
        try {
            this.postManager.incrementViews(postId);
            const post = this.postManager.getPost(postId);
            if (!post) return;

            this.currentPostId = postId;
            
            const userBadge = post.isUserPost ? '🔸 ' : '';
            
            document.getElementById('post-detail').innerHTML = `
                <h1 class="post-detail-title">${userBadge}${this.escapeHtml(post.title)}</h1>
                <div class="post-detail-meta">
                    작성자: ${this.escapeHtml(post.author)} | 
                    조회 ${post.views} | 
                    좋아요 ${post.likes}
                </div>
                <div class="post-detail-content">${this.escapeHtml(post.content)}</div>
                <div class="post-actions">
                    <button onclick="app.likePost('${post.id}')">👍 좋아요 (${post.likes})</button>
                    ${this.postManager.canDeletePost(post) ? `<button onclick="app.deletePost('${post.id}')">🗑️ 삭제</button>` : ''}
                    <button onclick="app.switchView('home')">📝 목록으로</button>
                </div>
            `;

            // 댓글 작성자 자동 입력
            if (this.authManager.isLoggedIn()) {
                document.getElementById('comment-author').value = this.authManager.getCurrentUser().nickname;
                document.getElementById('comment-author').readOnly = true;
            } else {
                document.getElementById('comment-author').readOnly = false;
            }

            this.renderComments(postId);
            this.switchView('detail');
        } catch (error) {
            alert(error.message);
        }
    }

    // 게시글 좋아요
    likePost(postId) {
        this.postManager.likePost(postId);
        this.showPost(postId); // 새로고침
    }

    // 게시글 삭제
    deletePost(postId) {
        if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            try {
                this.postManager.deletePost(postId);
                this.switchView('home');
            } catch (error) {
                alert(error.message);
            }
        }
    }

    // 댓글 생성
    createComment() {
        try {
            const author = document.getElementById('comment-author').value.trim();
            const content = document.getElementById('comment-content').value.trim();

            this.postManager.createComment(this.currentPostId, author, content);
            document.getElementById('comment-content').value = '';
            this.renderComments(this.currentPostId);
        } catch (error) {
            alert(error.message);
        }
    }

    // 댓글 표시
    renderComments(postId) {
        const container = document.getElementById('comments-container');
        const comments = this.postManager.getComments(postId);

        if (comments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = comments.map(comment => {
            const userBadge = comment.isUserComment ? '🔸 ' : '';
            return `
                <div class="comment-item fade-in">
                    <div class="comment-meta">
                        ${userBadge}${this.escapeHtml(comment.author)}
                    </div>
                    <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                </div>
            `;
        }).join('');
    }

    // 관리자 패널 렌더링
    renderAdminPanel() {
        if (!this.authManager.isAdmin()) {
            alert('관리자 권한이 필요합니다.');
            this.switchView('galleries');
            return;
        }

        // 관리자 뷰가 없으면 생성
        let adminView = document.getElementById('admin-view');
        if (!adminView) {
            adminView = document.createElement('section');
            adminView.id = 'admin-view';
            adminView.className = 'view';
            document.querySelector('.container').appendChild(adminView);
        }

        try {
            const stats = this.adminManager.getDashboardStats();
            const themeStats = this.themeManager.getThemeStats();
            
            adminView.innerHTML = `
                <h2>관리자 패널</h2>
                <div class="admin-dashboard">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>총 사용자</h3>
                            <p>${stats.summary.totalUsers}</p>
                        </div>
                        <div class="stat-card">
                            <h3>총 갤러리</h3>
                            <p>${stats.summary.totalGalleries}</p>
                        </div>
                        <div class="stat-card">
                            <h3>총 게시글</h3>
                            <p>${stats.summary.totalPosts}</p>
                        </div>
                        <div class="stat-card">
                            <h3>총 댓글</h3>
                            <p>${stats.summary.totalComments}</p>
                        </div>
                        <div class="stat-card">
                            <h3>현재 테마</h3>
                            <p>${themeStats.currentTheme === 'dark' ? '🌙 다크' : '☀️ 라이트'}</p>
                        </div>
                        <div class="stat-card">
                            <h3>테마 설정</h3>
                            <p>${themeStats.isSystemTheme ? '시스템' : '수동'}</p>
                        </div>
                    </div>
                    
                    <div class="admin-actions">
                        <button onclick="app.showCreateGallery()">새 갤러리 생성</button>
                        <button onclick="app.exportData()">데이터 백업</button>
                        <button onclick="app.showSystemLogs()">시스템 로그</button>
                        <button onclick="app.resetTheme()">테마 초기화</button>
                    </div>
                </div>
            `;
        } catch (error) {
            alert(error.message);
        }
    }

    // 데이터 백업
    exportData() {
        try {
            const backupData = this.adminManager.createBackup();
            const blob = new Blob([backupData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gp-inside-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            alert(error.message);
        }
    }

    // 시스템 로그 표시
    showSystemLogs() {
        try {
            const logs = this.adminManager.getSystemLogs();
            let logHtml = '<h3>시스템 로그</h3><div class="system-logs">';
            
            logs.forEach(log => {
                logHtml += `
                    <div class="log-item">
                        <span class="log-time">${this.formatTimeAgo(log.timestamp)}</span>
                        <span class="log-message">${log.message}</span>
                    </div>
                `;
            });
            
            logHtml += '</div>';
            
            // 임시 모달로 표시
            alert('시스템 로그:\n\n' + logs.map(log => `${this.formatTimeAgo(log.timestamp)}: ${log.message}`).join('\n'));
        } catch (error) {
            alert(error.message);
        }
    }

    // 통계 업데이트
    updateStats() {
        const stats = this.postManager.getStats();
        document.getElementById('total-posts').textContent = stats.totalPosts;
        document.getElementById('total-comments').textContent = stats.totalComments;
        document.getElementById('today-posts').textContent = stats.todayPosts;
    }

    // 폼 초기화
    clearForm() {
        document.getElementById('post-form').reset();
        
        if (this.authManager.isLoggedIn()) {
            document.getElementById('post-author').value = this.authManager.getCurrentUser().nickname;
            document.getElementById('post-author').readOnly = true;
        } else {
            document.getElementById('post-author').readOnly = false;
        }
    }

    // 시간 포맷팅 (상대 시간 표시 제거)
    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 테마 초기화
    resetTheme() {
        if (confirm('테마 설정을 초기화하시겠습니까? 시스템 설정을 따라갑니다.')) {
            this.themeManager.resetTheme();
            alert('테마가 초기화되었습니다.');
        }
    }

    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 애플리케이션 초기화
const app = new GPInside();