// 게시글 관련 함수들

// 게시글 필터링
function filterPosts() {
    let filtered = [...AppState.posts];
    
    // 카테고리 필터
    if (AppState.currentCategory !== 'all') {
        filtered = filtered.filter(post => post.category === AppState.currentCategory);
    }
    
    // 검색 필터
    if (AppState.searchQuery) {
        const query = AppState.searchQuery.toLowerCase();
        filtered = filtered.filter(post => 
            post.title.toLowerCase().includes(query) || 
            post.content.toLowerCase().includes(query)
        );
    }
    
    // 정렬
    switch (AppState.currentSort) {
        case 'hot':
            filtered.sort((a, b) => (b.likes + b.comments * 2) - (a.likes + a.comments * 2));
            break;
        case 'new':
            filtered.sort((a, b) => b.timestamp - a.timestamp);
            break;
        case 'top':
            filtered.sort((a, b) => b.likes - a.likes);
            break;
    }
    
    AppState.filteredPosts = filtered;
}

// 게시글 렌더링
function renderPosts() {
    const container = document.getElementById('postsContainer');
    const start = (AppState.currentPage - 1) * AppState.postsPerPage;
    const end = start + AppState.postsPerPage;
    const postsToShow = AppState.filteredPosts.slice(start, end);
    
    if (postsToShow.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-secondary);">게시글이 없습니다.</div>';
        return;
    }
    
    container.innerHTML = postsToShow.map(post => {
        const isBookmarked = AppState.bookmarks.has(post.id);
        return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-meta">
                    <div class="post-author">
                        <div class="author-avatar" style="background: ${getRandomColor()}">${post.authorInitial}</div>
                        <span class="author-name">${post.author}</span>
                    </div>
                    <span class="post-time">${formatTimeAgo(post.timestamp)}</span>
                </div>
                <div class="post-header-actions">
                    <span class="post-category-badge">${post.categoryName}</span>
                    <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                            data-bookmark-id="${post.id}" 
                            onclick="toggleBookmark(${post.id}, event)">
                        ${isBookmarked ? '🔖' : '📑'}
                    </button>
                </div>
            </div>
            <h3 class="post-title">${post.title}</h3>
            <p class="post-content-preview">${post.content}</p>
            <div class="post-tags">
                ${post.tags && post.tags.length > 0 ? post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('') : ''}
            </div>
            <div class="post-footer">
                <div class="post-stat" onclick="votePost(${post.id}, 1, event)">
                    <span class="stat-icon">👍</span>
                    <span>${formatNumber(post.likes)}</span>
                </div>
                <div class="post-stat" onclick="votePost(${post.id}, -1, event)">
                    <span class="stat-icon">👎</span>
                    <span>${formatNumber(post.dislikes)}</span>
                </div>
                <div class="post-stat">
                    <span class="stat-icon">💬</span>
                    <span>${formatNumber(post.comments)}</span>
                </div>
                <div class="post-stat">
                    <span class="stat-icon">👁️</span>
                    <span>${formatNumber(post.views)}</span>
                </div>
            </div>
        </div>
    `}).join('');
    
    // 게시글 클릭 이벤트
    container.querySelectorAll('.post-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // 버튼 클릭시 상세보기 방지
            if (e.target.closest('.post-stat') || e.target.closest('.bookmark-btn')) {
                return;
            }
            const postId = parseInt(card.dataset.postId);
            openPostDetail(postId);
        });
    });
    
    renderPagination();
    updateTrendingList();
}

// 게시글 상세 보기
function openPostDetail(postId) {
    const post = AppState.posts.find(p => p.id === postId);
    if (!post) return;
    
    const modal = document.getElementById('postModal');
    const content = document.getElementById('postDetailContent');
    
    // 조회수 증가
    post.views++;
    saveState();
    
    const isBookmarked = AppState.bookmarks.has(post.id);
    
    content.innerHTML = `
        <div class="post-detail-header">
            <h2 class="post-detail-title">${post.title}</h2>
            <div class="post-detail-meta">
                <div class="post-author">
                    <div class="author-avatar" style="background: ${getRandomColor()}">${post.authorInitial}</div>
                    <span class="author-name">${post.author}</span>
                </div>
                <span class="post-time">${formatTimeAgo(post.timestamp)}</span>
                <span class="post-category-badge">${post.categoryName}</span>
                <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                        data-bookmark-id="${post.id}" 
                        onclick="toggleBookmark(${post.id}, event)">
                    ${isBookmarked ? '🔖' : '📑'}
                </button>
            </div>
        </div>
        
        <div class="post-detail-content">
            ${post.content}
            <br><br>
            이것은 샘플 게시글 내용입니다. 실제 환경에서는 여기에 더 많은 내용이 표시됩니다.
            사용자가 작성한 전체 내용이 이곳에 렌더링되며, 이미지나 링크 등도 포함될 수 있습니다.
        </div>
        
        <div class="post-actions">
            <button class="action-btn upvote" onclick="votePost(${post.id}, 1)">
                <span>👍</span>
                <span>추천 ${formatNumber(post.likes)}</span>
            </button>
            <button class="action-btn downvote" onclick="votePost(${post.id}, -1)">
                <span>👎</span>
                <span>비추천 ${formatNumber(post.dislikes)}</span>
            </button>
            <button class="action-btn" onclick="toggleBookmark(${post.id}, event)">
                <span>${isBookmarked ? '🔖' : '📑'}</span>
                <span>${isBookmarked ? '북마크됨' : '북마크'}</span>
            </button>
            <button class="action-btn" onclick="sharePost(${post.id})">
                <span>📤</span>
                <span>공유</span>
            </button>
        </div>
        
        <div class="comments-section">
            <h3 class="comments-header">💬 댓글 ${post.comments}개</h3>
            
            <div class="comment-input">
                <textarea placeholder="댓글을 입력하세요..." id="newComment"></textarea>
                <button class="btn-primary" onclick="addComment(${post.id})">등록</button>
            </div>
            
            <div class="comments-list" id="commentsList">
                ${renderComments(post.commentsList || [])}
            </div>
        </div>
    `;
    
    openModal('postModal');
}

// 투표 기능
function votePost(postId, vote, event) {
    if (event) {
        event.stopPropagation();
    }
    
    const post = AppState.posts.find(p => p.id === postId);
    if (post) {
        if (vote > 0) {
            post.likes += 1;
            const likeBtn = event?.target.closest('.post-stat');
            if (likeBtn) animateLike(likeBtn);
            showNotification('👍 추천했습니다!');
        } else {
            post.dislikes += 1;
            showNotification('👎 비추천했습니다');
        }
        
        saveState();
        filterPosts();
        renderPosts();
        
        // 상세보기가 열려있으면 업데이트
        if (document.getElementById('postModal').classList.contains('show')) {
            openPostDetail(postId);
        }
    }
}

// 북마크 토글
function toggleBookmark(postId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    if (AppState.bookmarks.has(postId)) {
        AppState.bookmarks.delete(postId);
        showNotification('북마크가 해제되었습니다', 'info');
    } else {
        AppState.bookmarks.add(postId);
        showNotification('북마크에 추가되었습니다!');
    }
    
    saveState();
    updateBookmarkUI(postId);
    
    // 상세보기가 열려있으면 업데이트
    if (document.getElementById('postModal').classList.contains('show')) {
        openPostDetail(postId);
    }
}

// 게시글 공유
function sharePost(postId) {
    const post = AppState.posts.find(p => p.id === postId);
    if (post) {
        const text = `${post.title} - GP-INSIDE`;
        
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: post.content
            }).catch(() => {});
        } else {
            // 클립보드에 복사
            navigator.clipboard.writeText(text).then(() => {
                showNotification('링크가 클립보드에 복사되었습니다!');
            }).catch(() => {
                showNotification('공유 실패', 'error');
            });
        }
    }
}

// 새 게시글 작성
function createNewPost(category, title, content, tags) {
    // 로그인 체크
    if (!isLoggedIn()) {
        showNotification('로그인이 필요합니다.', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        return;
    }
    
    const user = getCurrentUser();
    const categoryNames = {
        free: '자유게시판',
        humor: '유머',
        tech: '기술',
        game: '게임',
        news: '뉴스'
    };
    
    const newPost = {
        id: Date.now(),
        title: title,
        content: content,
        category: category,
        categoryName: categoryNames[category],
        author: user.nickname,
        authorInitial: user.avatar,
        timestamp: new Date(),
        views: 0,
        likes: 0,
        dislikes: 0,
        comments: 0,
        tags: tags ? tags.split(',').map(t => '#' + t.trim()) : [],
        commentsList: []
    };
    
    AppState.posts.unshift(newPost);
    saveState();
    filterPosts();
    renderPosts();
    
    // 사용자 통계 업데이트
    updateUserStats('post');
    
    showNotification('게시글이 등록되었습니다!');
}
