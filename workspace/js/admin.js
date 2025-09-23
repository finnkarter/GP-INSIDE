// 관리자 전용 기능 모듈
class AdminManager {
    constructor(authManager, galleryManager, postManager) {
        this.authManager = authManager;
        this.galleryManager = galleryManager;
        this.postManager = postManager;
    }

    // 관리자 권한 확인
    requireAdmin() {
        if (!this.authManager.isAdmin()) {
            throw new Error('관리자 권한이 필요합니다.');
        }
    }

    // 전체 통계 대시보드
    getDashboardStats() {
        this.requireAdmin();

        const userStats = this.authManager.getStats();
        const galleryStats = this.galleryManager.getStats();
        const postStats = this.postManager.getStats();

        return {
            users: userStats,
            galleries: galleryStats,
            posts: postStats,
            summary: {
                totalUsers: userStats.totalUsers,
                totalGalleries: galleryStats.totalGalleries,
                totalPosts: postStats.totalPosts,
                totalComments: postStats.totalComments,
                todayPosts: postStats.todayPosts
            }
        };
    }

    // 사용자 관리
    getUserManagement() {
        this.requireAdmin();
        
        const users = this.authManager.getAllUsers();
        return users.map(user => ({
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt,
            postCount: this.postManager.getAllPosts().filter(p => p.authorId === user.id).length
        }));
    }

    // 갤러리 관리
    getGalleryManagement() {
        this.requireAdmin();
        
        return this.galleryManager.getAllGalleries().map(gallery => ({
            ...gallery,
            canDelete: gallery.id !== 'notice' // 공지사항 갤러리는 삭제 불가
        }));
    }

    // 게시글 관리 (전체)
    getPostManagement() {
        this.requireAdmin();
        
        return this.postManager.getAllPosts().map(post => ({
            ...post,
            galleryName: this.galleryManager.getGallery(post.galleryId)?.name || '알 수 없음',
            commentCount: this.postManager.getComments(post.id).length
        }));
    }

    // 사용자 차단/해제
    toggleUserBan(userId) {
        this.requireAdmin();
        
        const users = this.authManager.getAllUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }

        if (user.isAdmin) {
            throw new Error('관리자는 차단할 수 없습니다.');
        }

        user.isBanned = !user.isBanned;
        this.authManager.saveUsers();
        
        return user.isBanned;
    }

    // 게시글 강제 삭제
    forceDeletePost(postId) {
        this.requireAdmin();
        this.postManager.deletePost(postId);
    }

    // 갤러리 강제 삭제
    forceDeleteGallery(galleryId) {
        this.requireAdmin();
        
        if (galleryId === 'notice') {
            throw new Error('공지사항 갤러리는 삭제할 수 없습니다.');
        }
        
        // 해당 갤러리의 모든 게시글 삭제
        const posts = this.postManager.getPostsByGallery(galleryId);
        posts.forEach(post => {
            this.postManager.deletePost(post.id);
        });
        
        this.galleryManager.deleteGallery(galleryId);
    }

    // 시스템 로그 (활동 기록)
    getSystemLogs() {
        this.requireAdmin();
        
        const logs = [];
        
        // 최근 게시글 활동
        const recentPosts = this.postManager.getAllPosts()
            .slice(0, 10)
            .map(post => ({
                type: 'post_created',
                message: `새 게시글: "${post.title}" by ${post.author}`,
                timestamp: post.createdAt,
                galleryName: this.galleryManager.getGallery(post.galleryId)?.name
            }));
        
        // 최근 사용자 등록
        const recentUsers = this.authManager.getAllUsers()
            .filter(user => !user.isAdmin)
            .slice(-5)
            .map(user => ({
                type: 'user_registered',
                message: `새 사용자 가입: ${user.nickname} (${user.username})`,
                timestamp: user.createdAt
            }));
        
        logs.push(...recentPosts, ...recentUsers);
        
        // 시간순 정렬
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // 데이터 백업 생성
    createBackup() {
        this.requireAdmin();
        
        const backup = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            data: {
                users: this.authManager.getAllUsers(),
                galleries: this.galleryManager.getAllGalleries(),
                posts: this.postManager.getAllPosts(),
                comments: this.postManager.comments
            }
        };
        
        return JSON.stringify(backup, null, 2);
    }

    // 데이터 복원 (주의: 기존 데이터 덮어씀)
    restoreBackup(backupData) {
        this.requireAdmin();
        
        try {
            const backup = JSON.parse(backupData);
            
            if (!backup.data) {
                throw new Error('잘못된 백업 파일 형식입니다.');
            }
            
            // 데이터 복원
            localStorage.setItem('gp-users', JSON.stringify(backup.data.users));
            localStorage.setItem('gp-galleries', JSON.stringify(backup.data.galleries));
            localStorage.setItem('gp-posts', JSON.stringify(backup.data.posts));
            localStorage.setItem('gp-comments', JSON.stringify(backup.data.comments));
            
            return true;
        } catch (error) {
            throw new Error('백업 복원 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 시스템 초기화 (주의: 모든 데이터 삭제)
    resetSystem() {
        this.requireAdmin();
        
        localStorage.removeItem('gp-users');
        localStorage.removeItem('gp-galleries');
        localStorage.removeItem('gp-posts');
        localStorage.removeItem('gp-comments');
        localStorage.removeItem('gp-current-user');
        
        // 페이지 새로고침 필요
        return true;
    }

    // 관리자 전용 공지사항 작성
    createNotice(title, content) {
        this.requireAdmin();
        
        return this.postManager.createPost(
            title,
            this.authManager.getCurrentUser().nickname,
            content,
            'notice'
        );
    }
}
