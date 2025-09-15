// 글쓰기 페이지 JavaScript

let isEditMode = false;
let editPostId = '';
let selectedGalleryId = '';

document.addEventListener('DOMContentLoaded', function() {
    // 로그인 체크
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        window.location.href = 'auth.html';
        return;
    }
    
    const urlParams = getUrlParams();
    selectedGalleryId = urlParams.gallery || '';
    editPostId = urlParams.edit || '';
    const isNoticeMode = urlParams.notice === 'true';
    
    if (editPostId) {
        isEditMode = true;
        loadPostForEdit();
    } else {
        setupNewPost(isNoticeMode);
    }
    
    setupFormValidation();
    setupEditor();
    loadDraftIfExists();
});

// 새 글 작성 설정
function setupNewPost(isNoticeMode = false) {
    if (selectedGalleryId) {
        document.getElementById('gallerySelect').value = selectedGalleryId;
    }
    
    // 공지글 체크박스는 Hamilton 계정만 표시
    if (!currentUser.isAdmin || currentUser.id !== 'lewishamilton44') {
        document.getElementById('noticePost').parentElement.style.display = 'none';
    } else if (isNoticeMode) {
        // 공지글 작성 모드인 경우 자동으로 체크하고 자유게시판 선택
        document.getElementById('noticePost').checked = true;
        document.getElementById('gallerySelect').value = 'free';
        document.querySelector('.write-header h1').textContent = '공지글 작성';
        document.title = '공지글 작성 - 영감 인사이드';
    }
}

// 수정할 게시글 로드
function loadPostForEdit() {
    const post = getPostById(editPostId);
    
    if (!post) {
        alert('게시글을 찾을 수 없습니다.');
        window.location.href = 'index.html';
        return;
    }
    
    // 작성자 확인
    if (currentUser.id !== post.authorId && !currentUser.isAdmin) {
        alert('수정 권한이 없습니다.');
        window.location.href = `post.html?id=${editPostId}`;
        return;
    }
    
    // 폼에 데이터 채우기
    document.getElementById('gallerySelect').value = post.galleryId;
    document.getElementById('postTitle').value = post.title;
    document.getElementById('postContent').value = post.content;
    document.getElementById('anonymousPost').checked = post.isAnonymous || false;
    document.getElementById('noticePost').checked = post.type === 'notice';
    
    if (post.tags) {
        document.getElementById('postTags').value = post.tags.join(', ');
    }
    
    // 제목 변경
    document.querySelector('.write-header h1').textContent = '글 수정';
    document.title = '글 수정 - 영감 인사이드';
    
    updateCharCount();
}

// 폼 검증 설정
function setupFormValidation() {
    const titleInput = document.getElementById('postTitle');
    const contentInput = document.getElementById('postContent');
    
    titleInput.addEventListener('input', updateCharCount);
    contentInput.addEventListener('input', updateCharCount);
    
    // 실시간 유효성 검사
    titleInput.addEventListener('blur', validateTitle);
    contentInput.addEventListener('blur', validateContent);
}

// 문자 수 업데이트
function updateCharCount() {
    const titleInput = document.getElementById('postTitle');
    const contentInput = document.getElementById('postContent');
    const titleCount = document.getElementById('titleCharCount');
    const contentCount = document.getElementById('contentCharCount');
    
    const titleLength = titleInput.value.length;
    const contentLength = contentInput.value.length;
    
    titleCount.textContent = titleLength;
    contentCount.textContent = contentLength;
    
    // 경고 표시
    if (titleLength > 80) {
        titleCount.className = 'char-count warning';
    } else if (titleLength > 95) {
        titleCount.className = 'char-count error';
    } else {
        titleCount.className = 'char-count';
    }
    
    if (contentLength > 8000) {
        contentCount.className = 'char-count warning';
    } else if (contentLength > 9500) {
        contentCount.className = 'char-count error';
    } else {
        contentCount.className = 'char-count';
    }
}

// 제목 유효성 검사
function validateTitle() {
    const titleInput = document.getElementById('postTitle');
    const title = titleInput.value.trim();
    
    if (!title) {
        showFieldError(titleInput, '제목을 입력해주세요.');
        return false;
    }
    
    if (title.length < 2) {
        showFieldError(titleInput, '제목은 2자 이상이어야 합니다.');
        return false;
    }
    
    if (title.length > 100) {
        showFieldError(titleInput, '제목은 100자 이하여야 합니다.');
        return false;
    }
    
    clearFieldError(titleInput);
    return true;
}

// 내용 유효성 검사
function validateContent() {
    const contentInput = document.getElementById('postContent');
    const content = contentInput.value.trim();
    
    if (!content) {
        showFieldError(contentInput, '내용을 입력해주세요.');
        return false;
    }
    
    if (content.length < 5) {
        showFieldError(contentInput, '내용은 5자 이상이어야 합니다.');
        return false;
    }
    
    if (content.length > 10000) {
        showFieldError(contentInput, '내용은 10000자 이하여야 합니다.');
        return false;
    }
    
    clearFieldError(contentInput);
    return true;
}

// 필드 에러 표시
function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.add('error');
    
    let errorElement = formGroup.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        formGroup.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
}

// 필드 에러 제거
function clearFieldError(field) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.remove('error');
    
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

// 에디터 설정
function setupEditor() {
    // 파일 첨부 처리
    const fileInput = document.getElementById('fileAttachment');
    fileInput.addEventListener('change', handleFileAttachment);
}

// 파일 첨부 처리
function handleFileAttachment(event) {
    const files = Array.from(event.target.files);
    const preview = document.getElementById('filePreview');
    
    preview.innerHTML = '';
    
    files.forEach((file, index) => {
        if (file.size > 5 * 1024 * 1024) { // 5MB 제한
            alert(`${file.name}은 5MB를 초과합니다.`);
            return;
        }
        
        const previewItem = document.createElement('div');
        previewItem.className = 'file-preview-item';
        previewItem.innerHTML = `
            <span>${file.name} (${formatFileSize(file.size)})</span>
            <button type="button" class="remove-file" onclick="removeFile(${index})">×</button>
        `;
        
        preview.appendChild(previewItem);
    });
}

// 파일 제거
function removeFile(index) {
    const fileInput = document.getElementById('fileAttachment');
    const dt = new DataTransfer();
    const files = Array.from(fileInput.files);
    
    files.splice(index, 1);
    
    files.forEach(file => dt.items.add(file));
    fileInput.files = dt.files;
    
    handleFileAttachment({ target: fileInput });
}

// 파일 크기 포맷
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 텍스트 포맷팅
function formatText(command) {
    const textarea = document.getElementById('postContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    
    switch (command) {
        case 'bold':
            formattedText = `**${selectedText || '굵은 텍스트'}**`;
            break;
        case 'italic':
            formattedText = `*${selectedText || '기울임 텍스트'}*`;
            break;
        case 'underline':
            formattedText = `__${selectedText || '밑줄 텍스트'}__`;
            break;
    }
    
    textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    textarea.focus();
    
    updateCharCount();
}

// 링크 삽입
function insertLink() {
    const url = prompt('링크 URL을 입력하세요:');
    if (url) {
        const text = prompt('링크 텍스트를 입력하세요:', url);
        const textarea = document.getElementById('postContent');
        const link = `[${text}](${url})`;
        
        insertTextAtCursor(textarea, link);
    }
}

// 이미지 삽입
function insertImage() {
    const url = prompt('이미지 URL을 입력하세요:');
    if (url) {
        const alt = prompt('이미지 설명을 입력하세요 (선택사항):', '');
        const textarea = document.getElementById('postContent');
        const image = `![${alt}](${url})`;
        
        insertTextAtCursor(textarea, image);
    }
}

// 커서 위치에 텍스트 삽입
function insertTextAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
    textarea.setSelectionRange(start + text.length, start + text.length);
    textarea.focus();
    
    updateCharCount();
}

// 임시저장
function saveDraft() {
    const formData = getFormData();
    
    if (!formData.title && !formData.content) {
        alert('저장할 내용이 없습니다.');
        return;
    }
    
    const draftKey = isEditMode ? `draft_edit_${editPostId}` : 'draft_new_post';
    localStorage.setItem(draftKey, JSON.stringify({
        ...formData,
        savedAt: new Date().toISOString()
    }));
    
    showDraftNotification('임시저장되었습니다.');
}

// 임시저장 로드
function loadDraftIfExists() {
    const draftKey = isEditMode ? `draft_edit_${editPostId}` : 'draft_new_post';
    const draft = localStorage.getItem(draftKey);
    
    if (draft && !isEditMode) {
        const draftData = JSON.parse(draft);
        const savedTime = new Date(draftData.savedAt);
        
        if (confirm(`${formatDate(savedTime)}에 임시저장된 글이 있습니다. 불러오시겠습니까?`)) {
            document.getElementById('gallerySelect').value = draftData.galleryId || '';
            document.getElementById('postTitle').value = draftData.title || '';
            document.getElementById('postContent').value = draftData.content || '';
            document.getElementById('anonymousPost').checked = draftData.isAnonymous || false;
            document.getElementById('postTags').value = draftData.tags || '';
            
            updateCharCount();
        }
    }
}

// 임시저장 알림
function showDraftNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'draft-notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 미리보기
function previewPost() {
    const formData = getFormData();
    
    if (!formData.title || !formData.content) {
        alert('제목과 내용을 입력해주세요.');
        return;
    }
    
    const modal = document.getElementById('previewModal');
    const previewContent = document.getElementById('previewContent');
    
    // 마크다운 스타일 변환 (간단한 구현)
    let content = escapeHtml(formData.content);
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    content = content.replace(/__(.*?)__/g, '<u>$1</u>');
    content = content.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    content = content.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%;">');
    content = nl2br(content);
    
    previewContent.innerHTML = `
        <h2>${escapeHtml(formData.title)}</h2>
        <div style="margin: 20px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
            <strong>갤러리:</strong> ${getGalleryById(formData.galleryId)?.name || '선택되지 않음'}<br>
            <strong>작성자:</strong> ${formData.isAnonymous ? '익명' : currentUser.nickname}<br>
            <strong>작성일:</strong> ${formatDate(new Date())}
        </div>
        <div style="line-height: 1.6;">${content}</div>
    `;
    
    modal.style.display = 'flex';
}

// 미리보기 닫기
function closePreview() {
    document.getElementById('previewModal').style.display = 'none';
}

// 폼 데이터 수집
function getFormData() {
    const galleryId = document.getElementById('gallerySelect').value;
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const isAnonymous = document.getElementById('anonymousPost').checked;
    const isNotice = document.getElementById('noticePost').checked;
    const tags = document.getElementById('postTags').value.trim();
    
    return {
        galleryId,
        title,
        content,
        isAnonymous,
        isNotice,
        tags
    };
}

// 게시글 등록/수정
function submitPost(event) {
    event.preventDefault();
    
    // 유효성 검사
    if (!validateTitle() || !validateContent()) {
        alert('입력 내용을 확인해주세요.');
        return;
    }
    
    const formData = getFormData();
    
    if (!formData.galleryId) {
        alert('갤러리를 선택해주세요.');
        return;
    }
    
    // 로딩 상태 표시
    const form = document.getElementById('writeForm');
    form.classList.add('form-loading');
    
    setTimeout(() => {
        if (isEditMode) {
            updateExistingPost(formData);
        } else {
            createNewPost(formData);
        }
    }, 500);
}

// 새 게시글 생성
function createNewPost(formData) {
    const newPost = {
        id: generateId(),
        galleryId: formData.galleryId,
        title: formData.title,
        content: formData.content,
        author: formData.isAnonymous ? '익명' : currentUser.nickname,
        authorId: currentUser.id,
        date: new Date().toISOString(),
        views: 0,
        likes: 0,
        dislikes: 0,
        isAnonymous: formData.isAnonymous,
        type: formData.isNotice && currentUser.isAdmin && currentUser.id === 'lewishamilton44' ? 'notice' : 'normal',
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        voters: []
    };
    
    const posts = getPosts();
    posts.push(newPost);
    savePosts(posts);
    
    // 갤러리 통계 업데이트
    updateGalleryStats(formData.galleryId);
    
    // 임시저장 데이터 삭제
    localStorage.removeItem('draft_new_post');
    
    alert('게시글이 등록되었습니다.');
    window.location.href = `post.html?id=${newPost.id}`;
}

// 기존 게시글 수정
function updateExistingPost(formData) {
    const updateData = {
        title: formData.title,
        content: formData.content,
        isAnonymous: formData.isAnonymous,
        type: formData.isNotice && currentUser.isAdmin && currentUser.id === 'lewishamilton44' ? 'notice' : 'normal',
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        editedAt: new Date().toISOString()
    };
    
    updatePost(editPostId, updateData);
    
    // 임시저장 데이터 삭제
    localStorage.removeItem(`draft_edit_${editPostId}`);
    
    alert('게시글이 수정되었습니다.');
    window.location.href = `post.html?id=${editPostId}`;
}

// 취소
function cancelWrite() {
    const hasContent = document.getElementById('postTitle').value.trim() || 
                     document.getElementById('postContent').value.trim();
    
    if (hasContent) {
        if (confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
            if (confirm('임시저장하시겠습니까?')) {
                saveDraft();
            }
            history.back();
        }
    } else {
        history.back();
    }
}

// 자동 저장 (10분마다)
setInterval(() => {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    
    if (title || content) {
        saveDraft();
    }
}, 10 * 60 * 1000);

// 페이지 떠나기 전 경고
window.addEventListener('beforeunload', function(e) {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    
    if (title || content) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// 전역 함수 등록
window.formatText = formatText;
window.insertLink = insertLink;
window.insertImage = insertImage;
window.saveDraft = saveDraft;
window.previewPost = previewPost;
window.closePreview = closePreview;
window.submitPost = submitPost;
window.cancelWrite = cancelWrite;
window.removeFile = removeFile;
