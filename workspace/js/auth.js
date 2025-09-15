// 인증 관련 JavaScript

let isIdChecked = false;
let isNicknameChecked = false;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = getUrlParams();
    
    // URL 파라미터에 따라 폼 표시
    if (urlParams.mode === 'signup') {
        showSignupForm();
    }
    
    // 이미 로그인된 경우 메인으로 리다이렉트
    if (currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    setupFormValidation();
});

// 로그인 폼 표시
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

// 회원가입 폼 표시
function showSignupForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

// 로그인 처리
function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const id = formData.get('id').trim();
    const password = formData.get('password').trim();
    
    if (!id || !password) {
        showError('아이디와 비밀번호를 입력해주세요.');
        return;
    }
    
    const users = getUsers();
    const user = users.find(u => u.id === id && u.password === password);
    
    if (user) {
        // 로그인 성공
        currentUser = user;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        
        // 사용자 상태를 활성으로 업데이트 (로그인 시간 포함)
        updateUserStatus(user.id, true);
        
        showSuccess('로그인 성공!');
        
        // 이전 페이지로 돌아가거나 메인으로
        const referrer = document.referrer;
        if (referrer && referrer.includes(window.location.hostname)) {
            window.location.href = referrer;
        } else {
            window.location.href = 'index.html';
        }
    } else {
        showError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
}

// 회원가입 처리
function handleSignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const id = formData.get('id').trim();
    const password = formData.get('password').trim();
    const passwordConfirm = formData.get('passwordConfirm').trim();
    const nickname = formData.get('nickname').trim();
    const email = formData.get('email').trim();
    const agreeTerms = formData.get('agreeTerms');
    
    // 유효성 검사
    if (!validateSignupForm(id, password, passwordConfirm, nickname, agreeTerms)) {
        return;
    }
    
    // 중복 확인
    if (!isIdChecked) {
        showError('아이디 중복확인을 해주세요.');
        return;
    }
    
    if (!isNicknameChecked) {
        showError('닉네임 중복확인을 해주세요.');
        return;
    }
    
    // 사용자 생성
    const newUser = {
        id: id,
        password: password, // 실제로는 해시화해야 함
        nickname: nickname,
        email: email,
        joinDate: new Date().toISOString(),
        lastLogin: null,
        lastActivity: new Date().toISOString(),
        isActive: false, // 회원가입 시에는 비활성 상태
        posts: [],
        comments: [],
        likes: [],
        bookmarks: [],
        isAdmin: false,
        role: 'user'
    };
    
    const users = getUsers();
    users.push(newUser);
    saveUsers(users);
    
    showSuccess('회원가입이 완료되었습니다! 로그인해주세요.');
    showLoginForm();
    
    // 폼 초기화
    event.target.reset();
    resetValidationFlags();
}

// 회원가입 폼 유효성 검사
function validateSignupForm(id, password, passwordConfirm, nickname, agreeTerms) {
    // 아이디 검사
    if (!id) {
        showError('아이디를 입력해주세요.');
        return false;
    }
    
    if (id.length < 4 || id.length > 20) {
        showError('아이디는 4-20자 사이여야 합니다.');
        return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(id)) {
        showError('아이디는 영문, 숫자, 언더스코어만 사용할 수 있습니다.');
        return false;
    }
    
    // 비밀번호 검사
    if (!password) {
        showError('비밀번호를 입력해주세요.');
        return false;
    }
    
    if (password.length < 6) {
        showError('비밀번호는 6자 이상이어야 합니다.');
        return false;
    }
    
    if (password !== passwordConfirm) {
        showError('비밀번호가 일치하지 않습니다.');
        return false;
    }
    
    // 닉네임 검사
    if (!nickname) {
        showError('닉네임을 입력해주세요.');
        return false;
    }
    
    if (nickname.length < 2 || nickname.length > 12) {
        showError('닉네임은 2-12자 사이여야 합니다.');
        return false;
    }
    
    // 약관 동의 확인
    if (!agreeTerms) {
        showError('이용약관에 동의해주세요.');
        return false;
    }
    
    return true;
}

// 아이디 중복 확인
function checkIdDuplicate() {
    const idInput = document.getElementById('signupId');
    const id = idInput.value.trim();
    const messageElement = document.getElementById('idCheckMessage');
    
    if (!id) {
        showMessage(messageElement, '아이디를 입력해주세요.', 'error');
        return;
    }
    
    if (id.length < 4 || id.length > 20) {
        showMessage(messageElement, '아이디는 4-20자 사이여야 합니다.', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(id)) {
        showMessage(messageElement, '아이디는 영문, 숫자, 언더스코어만 사용할 수 있습니다.', 'error');
        return;
    }
    
    const users = getUsers();
    const existingUser = users.find(user => user.id === id);
    
    if (existingUser) {
        showMessage(messageElement, '이미 사용중인 아이디입니다.', 'error');
        isIdChecked = false;
    } else {
        showMessage(messageElement, '사용 가능한 아이디입니다.', 'success');
        isIdChecked = true;
    }
}

// 닉네임 중복 확인
function checkNicknameDuplicate() {
    const nicknameInput = document.getElementById('signupNickname');
    const nickname = nicknameInput.value.trim();
    const messageElement = document.getElementById('nicknameCheckMessage');
    
    if (!nickname) {
        showMessage(messageElement, '닉네임을 입력해주세요.', 'error');
        return;
    }
    
    if (nickname.length < 2 || nickname.length > 12) {
        showMessage(messageElement, '닉네임은 2-12자 사이여야 합니다.', 'error');
        return;
    }
    
    const users = getUsers();
    const existingUser = users.find(user => user.nickname === nickname);
    
    if (existingUser) {
        showMessage(messageElement, '이미 사용중인 닉네임입니다.', 'error');
        isNicknameChecked = false;
    } else {
        showMessage(messageElement, '사용 가능한 닉네임입니다.', 'success');
        isNicknameChecked = true;
    }
}

// 메시지 표시 헬퍼
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `check-message ${type}`;
}

// 폼 검증 플래그 리셋
function resetValidationFlags() {
    isIdChecked = false;
    isNicknameChecked = false;
    
    document.getElementById('idCheckMessage').textContent = '';
    document.getElementById('nicknameCheckMessage').textContent = '';
    document.getElementById('passwordCheckMessage').textContent = '';
}

// 실시간 폼 검증 설정
function setupFormValidation() {
    // 아이디 입력 시 중복확인 플래그 리셋
    const idInput = document.getElementById('signupId');
    if (idInput) {
        idInput.addEventListener('input', function() {
            isIdChecked = false;
            document.getElementById('idCheckMessage').textContent = '';
        });
    }
    
    // 닉네임 입력 시 중복확인 플래그 리셋
    const nicknameInput = document.getElementById('signupNickname');
    if (nicknameInput) {
        nicknameInput.addEventListener('input', function() {
            isNicknameChecked = false;
            document.getElementById('nicknameCheckMessage').textContent = '';
        });
    }
    
    // 비밀번호 확인 실시간 검증
    const passwordInput = document.getElementById('signupPassword');
    const passwordConfirmInput = document.getElementById('signupPasswordConfirm');
    const passwordMessage = document.getElementById('passwordCheckMessage');
    
    if (passwordConfirmInput && passwordMessage) {
        passwordConfirmInput.addEventListener('input', function() {
            const password = passwordInput.value;
            const passwordConfirm = this.value;
            
            if (passwordConfirm) {
                if (password === passwordConfirm) {
                    showMessage(passwordMessage, '비밀번호가 일치합니다.', 'success');
                } else {
                    showMessage(passwordMessage, '비밀번호가 일치하지 않습니다.', 'error');
                }
            } else {
                passwordMessage.textContent = '';
            }
        });
    }
    
    // 비밀번호 강도 표시 (향후 구현)
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            // 비밀번호 강도 검사 로직 추가 가능
        });
    }
}

// 전역 함수 등록
window.showLoginForm = showLoginForm;
window.showSignupForm = showSignupForm;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.checkIdDuplicate = checkIdDuplicate;
window.checkNicknameDuplicate = checkNicknameDuplicate;
