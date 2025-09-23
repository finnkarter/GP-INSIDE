// 게시글 및 댓글 관리 모듈
class PostManager {
    constructor(authManager, galleryManager) {
        this.authManager = authManager;
        this.galleryManager = galleryManager;
        this.posts = JSON.parse(localStorage.getItem('gp-posts') || '[]');
        this.comments = JSON.parse(localStorage.getItem('gp-comments') || '{}');
        
        // 기본 게시글이 없으면 생성
        if (this.posts.length === 0) {
            this.createSamplePosts();
        }
    }

    // 게시글 생성
    createPost(title, author, content, galleryId) {
        if (!title || !author || !content) {
            throw new Error('모든 필드를 입력해주세요.');
        }

        // 로그인한 사용자는 자동으로 닉네임 설정
        const finalAuthor = this.authManager.isLoggedIn() ? 
            this.authManager.getCurrentUser().nickname : author;

        const post = {
            id: Date.now().toString(),
            title: title.trim(),
            author: finalAuthor,
            content: content.trim(),
            galleryId: galleryId || 'free',
            createdAt: new Date().toISOString(),
            views: 0,
            likes: 0,
            isUserPost: this.authManager.isLoggedIn(),
            authorId: this.authManager.isLoggedIn() ? this.authManager.getCurrentUser().id : null
        };

        this.posts.unshift(post);
        
        // 갤러리 통계 업데이트
        this.galleryManager.updateGalleryStats(post.galleryId, 1);
        
        this.savePosts();
        return post;
    }

    // 게시글 삭제
    deletePost(postId) {
        const post = this.getPost(postId);
        if (!post) {
            throw new Error('게시글을 찾을 수 없습니다.');
        }

        // 삭제 권한 확인
        if (!this.canDeletePost(post)) {
            throw new Error('삭제 권한이 없습니다.');
        }

        this.posts = this.posts.filter(p => p.id !== postId);
        delete this.comments[postId];
        
        // 갤러리 통계 업데이트
        this.galleryManager.updateGalleryStats(post.galleryId, -1);
        
        this.savePosts();
        this.saveComments();
    }

    // 게시글 삭제 권한 확인
    canDeletePost(post) {
        const user = this.authManager.getCurrentUser();
        if (!user) return false;
        
        // 관리자는 모든 게시글 삭제 가능
        if (this.authManager.isAdmin()) return true;
        
        // 본인 게시글만 삭제 가능
        return post.authorId === user.id || post.author === user.nickname;
    }

    // 게시글 가져오기
    getPost(postId) {
        return this.posts.find(p => p.id === postId);
    }

    // 갤러리별 게시글 목록
    getPostsByGallery(galleryId) {
        return this.posts.filter(post => post.galleryId === galleryId);
    }

    // 게시글 검색
    searchPosts(galleryId, searchTerm) {
        let posts = this.getPostsByGallery(galleryId);
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            posts = posts.filter(post => 
                post.title.toLowerCase().includes(term) ||
                post.content.toLowerCase().includes(term) ||
                post.author.toLowerCase().includes(term)
            );
        }
        
        return posts;
    }

    // 게시글 정렬
    sortPosts(posts, sortBy) {
        const sortedPosts = [...posts];
        
        switch (sortBy) {
            case 'latest':
                return sortedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'oldest':
                return sortedPosts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'popular':
                return sortedPosts.sort((a, b) => (b.views + b.likes) - (a.views + a.likes));
            default:
                return sortedPosts;
        }
    }

    // 게시글 조회수 증가
    incrementViews(postId) {
        const post = this.getPost(postId);
        if (post) {
            post.views += 1;
            this.savePosts();
        }
    }

    // 게시글 좋아요
    likePost(postId) {
        const post = this.getPost(postId);
        if (post) {
            post.likes += 1;
            this.savePosts();
        }
    }

    // 댓글 생성
    createComment(postId, author, content) {
        if (!author || !content) {
            throw new Error('작성자와 댓글 내용을 입력해주세요.');
        }

        const comment = {
            id: Date.now().toString(),
            author: author.trim(),
            content: content.trim(),
            createdAt: new Date().toISOString(),
            isUserComment: this.authManager.isLoggedIn(),
            authorId: this.authManager.isLoggedIn() ? this.authManager.getCurrentUser().id : null
        };

        if (!this.comments[postId]) {
            this.comments[postId] = [];
        }

        this.comments[postId].push(comment);
        this.saveComments();
        
        return comment;
    }

    // 댓글 삭제 (관리자 또는 본인만)
    deleteComment(postId, commentId) {
        const postComments = this.comments[postId];
        if (!postComments) {
            throw new Error('댓글을 찾을 수 없습니다.');
        }

        const commentIndex = postComments.findIndex(c => c.id === commentId);
        if (commentIndex === -1) {
            throw new Error('댓글을 찾을 수 없습니다.');
        }

        const comment = postComments[commentIndex];
        const user = this.authManager.getCurrentUser();
        
        // 삭제 권한 확인
        if (!this.authManager.isAdmin() && 
            (!user || (comment.authorId !== user.id && comment.author !== user.nickname))) {
            throw new Error('삭제 권한이 없습니다.');
        }

        postComments.splice(commentIndex, 1);
        this.saveComments();
    }

    // 게시글의 댓글 목록
    getComments(postId) {
        return this.comments[postId] || [];
    }

    // 전체 게시글 목록
    getAllPosts() {
        return this.posts;
    }

    // 게시글 데이터 저장
    savePosts() {
        localStorage.setItem('gp-posts', JSON.stringify(this.posts));
    }

    // 댓글 데이터 저장
    saveComments() {
        localStorage.setItem('gp-comments', JSON.stringify(this.comments));
    }

    // 통계 정보
    getStats() {
        const totalComments = Object.values(this.comments).reduce((sum, comments) => sum + comments.length, 0);
        const today = new Date().toDateString();
        const todayPosts = this.posts.filter(post => 
            new Date(post.createdAt).toDateString() === today
        ).length;

        return {
            totalPosts: this.posts.length,
            totalComments,
            todayPosts,
            mostLikedPost: this.posts.sort((a, b) => b.likes - a.likes)[0],
            mostViewedPost: this.posts.sort((a, b) => b.views - a.views)[0]
        };
    }

    // 샘플 게시글 생성 (간소화)
    createSamplePosts() {
        const samplePosts = [
            {
                id: '1',
                title: 'GP-Inside에 오신 것을 환영합니다!',
                author: '관리자',
                content: `안녕하세요! GP-Inside 오프라인 커뮤니티에 오신 것을 환영합니다.

이 사이트는 인터넷 연결 없이도 사용할 수 있는 로컬 커뮤니티입니다.
모든 데이터는 브라우저의 로컬 스토리지에 저장되어 오프라인에서도 완벽하게 작동합니다.

주요 기능:
✅ 회원가입/로그인 시스템
✅ 갤러리 시스템 (관리자 관리)
✅ 다크/라이트 테마 전환
✅ 모듈화된 구조

자유롭게 글을 작성하고 소통해보세요!`,
                galleryId: 'free',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                views: 42,
                likes: 15,
                isUserPost: false,
                authorId: null
            }
        ];

        // 샘플 댓글
        const sampleComments = {
            '1': [
                {
                    id: 'c1',
                    author: '사용자1',
                    content: '정말 멋진 사이트네요! 오프라인에서도 완벽하게 작동하다니 감동입니다.',
                    createdAt: new Date(Date.now() - 21600000).toISOString(),
                    isUserComment: false,
                    authorId: null
                }
            ]
        };

        this.posts = samplePosts;
        this.comments = sampleComments;
        this.savePosts();
        this.saveComments();
    }
}
