// 게시글 보기 페이지 JavaScript

let currentPostId = '';
let currentPost = null;

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = getUrlParams();
    currentPostId = urlParams.id;
    
    if (!currentPostId) {
        showError('게시글을 찾을 수 없습니다.');
        window.location.href = 'index.html';
        return;
    }
    
    loadPost();
    loadComments();
    setupCommentForm();
});

// 게시글 로드
function loadPost() {
    currentPost = getPostById(currentPostId);
    
    if (!currentPost) {
        showError('게시글을 찾을 수 없습니다.');
        window.location.href = 'index.html';
        return;
    }
    
    // 조회수 증가
    incrementPostViews();
    
    // 갤러리 정보
    const gallery = getGalleryById(currentPost.galleryId);
    const galleryName = gallery ? gallery.name : '알 수 없음';
    document.getElementById('galleryName').textContent = galleryName;
    
    // 게시글 정보 표시
    document.getElementById('postNumber').textContent = `No. ${currentPost.id}`;
    document.getElementById('postTitle').textContent = currentPost.title;
    document.getElementById('postAuthor').textContent = currentPost.author;
    document.getElementById('postViews').textContent = currentPost.views || 0;
    document.getElementById('postLikes').textContent = currentPost.likes || 0;
    
    // 게시글 내용
    const contentElement = document.getElementById('postContent');
    contentElement.innerHTML = nl2br(escapeHtml(currentPost.content));
    
    // 추천/비추천 수 표시
    document.getElementById('likeCount').textContent = currentPost.likes || 0;
    document.getElementById('dislikeCount').textContent = currentPost.dislikes || 0;
    
    // 작성자 또는 관리자 권한 확인
    if (currentUser && (currentUser.id === currentPost.authorId || currentUser.isAdmin)) {
        document.getElementById('postManagement').style.display = 'block';
    }
    
    // 댓글 수 표시
    const comments = getComments().filter(c => c.postId === currentPostId);
    document.getElementById('commentCount').textContent = comments.length;
    document.getElementById('commentCountDisplay').textContent = comments.length;
    
    // 페이지 제목 설정
    document.title = `${currentPost.title} - ${galleryName} - 영감 인사이드`;
    
    // 북마크 상태 업데이트
    if (currentUser) {
        const isBookmarked = isPostBookmarked(currentPostId);
        updateBookmarkButton(currentPostId, isBookmarked);
    }
    
    // 이전/다음 게시글 로드
    loadAdjacentPosts();
}

// 조회수 증가
function incrementPostViews() {
    const viewedPosts = JSON.parse(sessionStorage.getItem('viewedPosts') || '[]');
    
    // 이미 본 게시글이면 조회수 증가하지 않음
    if (!viewedPosts.includes(currentPostId)) {
        currentPost.views = (currentPost.views || 0) + 1;
        updatePost(currentPostId, { views: currentPost.views });
        
        viewedPosts.push(currentPostId);
        sessionStorage.setItem('viewedPosts', JSON.stringify(viewedPosts));
    }
}

// 이전/다음 게시글 로드
function loadAdjacentPosts() {
    const posts = getPosts()
        .filter(post => post.galleryId === currentPost.galleryId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const currentIndex = posts.findIndex(post => post.id === currentPostId);
    
    // 이전글 (더 최근)
    const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
    const prevLink = document.getElementById('prevPostLink');
    if (prevPost) {
        prevLink.href = `post.html?id=${prevPost.id}`;
        prevLink.textContent = truncateText(prevPost.title, 50);
    } else {
        prevLink.parentElement.style.display = 'none';
    }
    
    // 다음글 (더 오래된)
    const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
    const nextLink = document.getElementById('nextPostLink');
    if (nextPost) {
        nextLink.href = `post.html?id=${nextPost.id}`;
        nextLink.textContent = truncateText(nextPost.title, 50);
    } else {
        nextLink.parentElement.style.display = 'none';
    }
}

// 댓글 로드
function loadComments() {
    const comments = getComments()
        .filter(comment => comment.postId === currentPostId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const container = document.getElementById('commentsList');
    
    if (comments.length === 0) {
        container.innerHTML = '<div class="empty-message">아직 댓글이 없습니다. 첫 댓글을 작성해보세요!</div>';
        return;
    }
    
    container.innerHTML = comments.map(comment => renderComment(comment)).join('');
}

// 댓글 렌더링
function renderComment(comment) {
    const isAuthor = currentUser && currentUser.id === comment.authorId;
    const isAdmin = comment.author === 'admin' || comment.isAdmin;
    const canManage = currentUser && (currentUser.id === comment.authorId || currentUser.isAdmin);
    
    let authorClass = 'comment-author';
    if (isAdmin) {
        authorClass += ' admin';
    } else if (comment.isAnonymous) {
        authorClass += ' anonymous';
    }
    
    return `
        <div class="comment-item ${comment.parentId ? 'reply' : ''}" data-comment-id="${comment.id}">
            <div class="comment-header">
                <span class="${authorClass}">${escapeHtml(comment.author)}</span>
            </div>
            <div class="comment-content">${nl2br(escapeHtml(comment.content))}</div>
            <div class="comment-actions">
                <div class="comment-vote">
                    <button onclick="voteComment('${comment.id}', 'like')" class="vote-btn like-btn">
                        👍 <span>${comment.likes || 0}</span>
                    </button>
                    <button onclick="voteComment('${comment.id}', 'dislike')" class="vote-btn dislike-btn">
                        👎 <span>${comment.dislikes || 0}</span>
                    </button>
                </div>
                ${!comment.parentId ? `<button onclick="showReplyForm('${comment.id}')">답글</button>` : ''}
                ${canManage ? `<button onclick="deleteComment('${comment.id}')">삭제</button>` : ''}
                <button onclick="reportComment('${comment.id}')">신고</button>
            </div>
            <div id="replyForm_${comment.id}" class="reply-form">
                <textarea placeholder="답글을 입력하세요..." rows="3"></textarea>
                <div class="form-actions">
                    <button onclick="submitReply('${comment.id}')" class="submit">답글 작성</button>
                    <button onclick="hideReplyForm('${comment.id}')" class="cancel">취소</button>
                </div>
            </div>
        </div>
    `;
}

// 댓글 폼 설정
function setupCommentForm() {
    const loginPrompt = document.getElementById('loginPrompt');
    const commentForm = document.getElementById('commentWriteForm');
    
    if (currentUser) {
        loginPrompt.style.display = 'none';
        commentForm.style.display = 'block';
    } else {
        loginPrompt.style.display = 'block';
        commentForm.style.display = 'none';
    }
}

// 댓글 작성
function submitComment() {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    const content = document.getElementById('commentContent').value.trim();
    const isAnonymous = document.getElementById('anonymousComment').checked;
    
    if (!content) {
        alert('댓글 내용을 입력해주세요.');
        return;
    }
    
    const newComment = {
        id: generateId(),
        postId: currentPostId,
        authorId: currentUser.id,
        author: isAnonymous ? '익명' : currentUser.nickname,
        content: content,
        date: new Date().toISOString(),
        isAnonymous: isAnonymous,
        likes: 0,
        dislikes: 0,
        parentId: null
    };
    
    const comments = getComments();
    comments.push(newComment);
    saveComments(comments);
    
    // 폼 초기화
    document.getElementById('commentContent').value = '';
    document.getElementById('anonymousComment').checked = false;
    
    // 댓글 목록 새로고침
    loadComments();
    
    // 댓글 수 업데이트
    const commentCount = comments.filter(c => c.postId === currentPostId).length;
    document.getElementById('commentCount').textContent = commentCount;
    document.getElementById('commentCountDisplay').textContent = commentCount;
    
    showSuccess('댓글이 작성되었습니다.');
}

// 답글 폼 표시
function showReplyForm(commentId) {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    // 다른 답글 폼들 숨기기
    document.querySelectorAll('.reply-form').forEach(form => {
        form.style.display = 'none';
    });
    
    const replyForm = document.getElementById(`replyForm_${commentId}`);
    replyForm.style.display = 'block';
    replyForm.querySelector('textarea').focus();
}

// 답글 폼 숨기기
function hideReplyForm(commentId) {
    const replyForm = document.getElementById(`replyForm_${commentId}`);
    replyForm.style.display = 'none';
    replyForm.querySelector('textarea').value = '';
}

// 답글 작성
function submitReply(parentCommentId) {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    const replyForm = document.getElementById(`replyForm_${parentCommentId}`);
    const content = replyForm.querySelector('textarea').value.trim();
    
    if (!content) {
        alert('답글 내용을 입력해주세요.');
        return;
    }
    
    const newReply = {
        id: generateId(),
        postId: currentPostId,
        authorId: currentUser.id,
        author: currentUser.nickname,
        content: content,
        date: new Date().toISOString(),
        isAnonymous: false,
        likes: 0,
        dislikes: 0,
        parentId: parentCommentId
    };
    
    const comments = getComments();
    comments.push(newReply);
    saveComments(comments);
    
    hideReplyForm(parentCommentId);
    loadComments();
    
    showSuccess('답글이 작성되었습니다.');
}

// 댓글 삭제
function deleteComment(commentId) {
    if (!currentUser) {
        showNotification('로그인이 필요합니다.', 'warning');
        return;
    }
    
    const comments = getComments();
    const comment = comments.find(c => c.id === commentId);
    
    if (!comment) {
        showNotification('댓글을 찾을 수 없습니다.', 'error');
        return;
    }
    
    // 권한 확인: 작성자 또는 관리자
    if (currentUser.id !== comment.authorId && !currentUser.isAdmin) {
        showNotification('댓글을 삭제할 권한이 없습니다.', 'error');
        return;
    }
    
    if (!confirm('댓글을 삭제하시겠습니까?')) {
        return;
    }
    
    const filteredComments = comments.filter(comment => 
        comment.id !== commentId && comment.parentId !== commentId
    );
    
    saveComments(filteredComments);
    loadComments();
    
    showNotification('댓글이 삭제되었습니다.', 'success');
}

// 댓글 추천/비추천
function voteComment(commentId, voteType) {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    const comments = getComments();
    const commentIndex = comments.findIndex(comment => comment.id === commentId);
    
    if (commentIndex === -1) return;
    
    const comment = comments[commentIndex];
    comment.voters = comment.voters || [];
    
    const existingVote = comment.voters.find(voter => voter.userId === currentUser.id);
    
    if (existingVote) {
        if (existingVote.type === voteType) {
            alert('이미 ' + (voteType === 'like' ? '추천' : '비추천') + '하셨습니다.');
            return;
        } else {
            existingVote.type = voteType;
            if (voteType === 'like') {
                comment.likes = (comment.likes || 0) + 1;
                comment.dislikes = Math.max(0, (comment.dislikes || 0) - 1);
            } else {
                comment.dislikes = (comment.dislikes || 0) + 1;
                comment.likes = Math.max(0, (comment.likes || 0) - 1);
            }
        }
    } else {
        comment.voters.push({
            userId: currentUser.id,
            type: voteType,
            date: new Date().toISOString()
        });
        
        if (voteType === 'like') {
            comment.likes = (comment.likes || 0) + 1;
        } else {
            comment.dislikes = (comment.dislikes || 0) + 1;
        }
    }
    
    saveComments(comments);
    loadComments();
}

// 게시글 수정
function editPost() {
    window.location.href = `write.html?edit=${currentPostId}`;
}

// 게시글 삭제
function deletePost() {
    // 권한 확인
    if (!currentUser || (currentUser.id !== currentPost.authorId && !currentUser.isAdmin)) {
        showNotification('게시글을 삭제할 권한이 없습니다.', 'error');
        return;
    }
    
    if (!confirm('게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        return;
    }
    
    // common.js의 deletePost 함수 호출 (이름 충돌 해결)
    const posts = getPosts();
    const filteredPosts = posts.filter(post => post.id !== currentPostId);
    savePosts(filteredPosts);
    
    // 댓글도 함께 삭제
    const comments = getComments();
    const filteredComments = comments.filter(comment => comment.postId !== currentPostId);
    saveComments(filteredComments);
    
    showNotification('게시글이 삭제되었습니다.', 'success');
    
    const gallery = getGalleryById(currentPost.galleryId);
    window.location.href = `gallery.html?id=${gallery.id}`;
}

// 북마크 토글
function togglePostBookmark() {
    if (!currentUser) {
        showNotification('로그인이 필요합니다.', 'warning');
        return;
    }
    
    toggleBookmark(currentPostId);
}

// 게시글 공유
function sharePost() {
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: currentPost.title,
            url: url
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            alert('링크가 클립보드에 복사되었습니다.');
        });
    } else {
        prompt('링크를 복사하세요:', url);
    }
}

// 게시글 신고
function reportPost() {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    const reason = prompt('신고 사유를 입력해주세요:');
    if (reason) {
        // 신고 기능 구현 (향후 추가)
        alert('신고가 접수되었습니다.');
    }
}

// 댓글 신고
function reportComment(commentId) {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    const reason = prompt('신고 사유를 입력해주세요:');
    if (reason) {
        // 신고 기능 구현 (향후 추가)
        alert('신고가 접수되었습니다.');
    }
}

// 전역 함수 등록
window.submitComment = submitComment;
window.showReplyForm = showReplyForm;
window.hideReplyForm = hideReplyForm;
window.submitReply = submitReply;
window.deleteComment = deleteComment;
window.voteComment = voteComment;
window.editPost = editPost;
window.deletePost = deletePost;
window.toggleBookmark = togglePostBookmark;
window.sharePost = sharePost;
window.reportPost = reportPost;
window.reportComment = reportComment;
