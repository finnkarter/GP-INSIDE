// 댓글 관련 함수들

// 댓글 렌더링
function renderComments(comments) {
    if (!comments || comments.length === 0) {
        return '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">아직 댓글이 없습니다.</div>';
    }
    
    return comments.map(comment => `
        <div class="comment" data-comment-id="${comment.id}">
            <div class="comment-header">
                <div class="comment-author">
                    <div class="author-avatar" style="background: ${getRandomColor()}">${comment.author[0]}</div>
                    <span>${comment.author}</span>
                </div>
                <span class="post-time">${formatTimeAgo(comment.timestamp)}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-actions">
                <span class="comment-action" onclick="likeComment(${comment.postId}, ${comment.id})">
                    👍 ${comment.likes || 0}
                </span>
                <span class="comment-action" onclick="replyToComment(${comment.id})">답글</span>
                <span class="comment-action" onclick="deleteComment(${comment.postId}, ${comment.id})">삭제</span>
            </div>
            ${comment.replies && comment.replies.length > 0 ? `
                <div class="comment-replies">
                    ${renderReplies(comment.replies)}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// 대댓글 렌더링
function renderReplies(replies) {
    return replies.map(reply => `
        <div class="comment reply" data-reply-id="${reply.id}">
            <div class="comment-header">
                <div class="comment-author">
                    <div class="author-avatar" style="background: ${getRandomColor()}">${reply.author[0]}</div>
                    <span>${reply.author}</span>
                </div>
                <span class="post-time">${formatTimeAgo(reply.timestamp)}</span>
            </div>
            <div class="comment-content">${reply.content}</div>
            <div class="comment-actions">
                <span class="comment-action" onclick="likeReply(${reply.commentId}, ${reply.id})">
                    👍 ${reply.likes || 0}
                </span>
                <span class="comment-action" onclick="deleteReply(${reply.postId}, ${reply.commentId}, ${reply.id})">삭제</span>
            </div>
        </div>
    `).join('');
}

// 댓글 추가
function addComment(postId) {
    // 로그인 체크
    if (!isLoggedIn()) {
        showNotification('로그인이 필요합니다.', 'warning');
        openLoginModal();
        return;
    }
    
    const commentInput = document.getElementById('newComment');
    const content = commentInput.value.trim();
    
    if (!content) {
        showNotification('댓글 내용을 입력해주세요.', 'warning');
        return;
    }
    
    const user = getCurrentUser();
    const post = AppState.posts.find(p => p.id === postId);
    if (post) {
        if (!post.commentsList) {
            post.commentsList = [];
        }
        
        const newComment = {
            id: Date.now(),
            postId: postId,
            author: user.nickname,
            content: content,
            timestamp: new Date(),
            likes: 0,
            replies: []
        };
        
        post.commentsList.push(newComment);
        post.comments = post.commentsList.length;
        
        commentInput.value = '';
        saveState();
        
        // 사용자 통계 업데이트
        updateUserStats('comment');
        
        showNotification('댓글이 등록되었습니다!');
        
        // 댓글 목록 업데이트
        const commentsList = document.getElementById('commentsList');
        if (commentsList) {
            commentsList.innerHTML = renderComments(post.commentsList);
        }
        
        // 댓글 수 업데이트
        const commentsHeader = document.querySelector('.comments-header');
        if (commentsHeader) {
            commentsHeader.textContent = `💬 댓글 ${post.comments}개`;
        }
    }
}

// 댓글 좋아요
function likeComment(postId, commentId) {
    const post = AppState.posts.find(p => p.id === postId);
    if (post && post.commentsList) {
        const comment = post.commentsList.find(c => c.id === commentId);
        if (comment) {
            comment.likes = (comment.likes || 0) + 1;
            saveState();
            showNotification('👍 댓글을 추천했습니다!');
            
            // UI 업데이트
            const commentsList = document.getElementById('commentsList');
            if (commentsList) {
                commentsList.innerHTML = renderComments(post.commentsList);
            }
        }
    }
}

// 댓글 삭제
function deleteComment(postId, commentId) {
    if (!showConfirm('댓글을 삭제하시겠습니까?')) {
        return;
    }
    
    const post = AppState.posts.find(p => p.id === postId);
    if (post && post.commentsList) {
        const index = post.commentsList.findIndex(c => c.id === commentId);
        if (index !== -1) {
            post.commentsList.splice(index, 1);
            post.comments = post.commentsList.length;
            saveState();
            showNotification('댓글이 삭제되었습니다', 'info');
            
            // UI 업데이트
            const commentsList = document.getElementById('commentsList');
            if (commentsList) {
                commentsList.innerHTML = renderComments(post.commentsList);
            }
            
            // 댓글 수 업데이트
            const commentsHeader = document.querySelector('.comments-header');
            if (commentsHeader) {
                commentsHeader.textContent = `💬 댓글 ${post.comments}개`;
            }
        }
    }
}

// 대댓글 작성 (미구현 - 향후 확장)
function replyToComment(commentId) {
    showNotification('대댓글 기능은 준비중입니다', 'info');
}

// 대댓글 좋아요 (미구현)
function likeReply(commentId, replyId) {
    showNotification('👍 추천했습니다!');
}

// 대댓글 삭제 (미구현)
function deleteReply(postId, commentId, replyId) {
    showNotification('대댓글이 삭제되었습니다', 'info');
}
