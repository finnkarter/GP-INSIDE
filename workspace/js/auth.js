// 인증 및 사용자 관리 모듈
class AuthManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('gp-users') || '[]');
        this.currentUser = JSON.parse(localStorage.getItem('gp-current-user') || 'null');
        
        // 관리자 계정 초기화
        this.initAdminAccount();
    }

    // 관리자 계정 초기화
    initAdminAccount() {
        const adminExists = this.users.find(u => u.username === 'hamilton44');
        
        if (!adminExists) {
            const adminUser = {
                id: 'admin_' + Date.now(),
                username: 'hamilton44',
                password: 'lewishamilton44!',
                nickname: '관리자',
                isAdmin: true,
                createdAt: new Date().toISOString()
            };
            
            this.users.push(adminUser);
            this.saveUsers();
        }
    }

    // 회원가입
    register(username, password, confirmPassword, nickname) {
        // 유효성 검사
        if (username.length < 4 || username.length > 20) {
            throw new Error('사용자명은 4-20자여야 합니다.');
        }

        if (password.length < 8) {
            throw new Error('비밀번호는 8자 이상이어야 합니다.');
        }

        if (password !== confirmPassword) {
            throw new Error('비밀번호가 일치하지 않습니다.');
        }

        if (!nickname || nickname.length < 2) {
            throw new Error('닉네임은 2자 이상이어야 합니다.');
        }

        // 중복 검사
        if (this.users.find(u => u.username === username)) {
            throw new Error('이미 존재하는 사용자명입니다.');
        }

        if (this.users.find(u => u.nickname === nickname)) {
            throw new Error('이미 존재하는 닉네임입니다.');
        }

        // 관리자 계정명 보호
        if (username === 'hamilton44' || nickname === '관리자') {
            throw new Error('사용할 수 없는 계정 정보입니다.');
        }

        // 사용자 생성
        const user = {
            id: Date.now().toString(),
            username,
            password, // 실제 운영에서는 해시화 필요
            nickname,
            isAdmin: false,
            createdAt: new Date().toISOString()
        };

        this.users.push(user);
        this.saveUsers();
        
        return user;
    }

    // 로그인
    login(username, password) {
        const user = this.users.find(u => u.username === username && u.password === password);

        if (!user) {
            throw new Error('사용자명 또는 비밀번호가 올바르지 않습니다.');
        }

        this.currentUser = user;
        localStorage.setItem('gp-current-user', JSON.stringify(user));
        
        return user;
    }

    // 로그아웃
    logout() {
        this.currentUser = null;
        localStorage.removeItem('gp-current-user');
    }

    // 현재 사용자 정보
    getCurrentUser() {
        return this.currentUser;
    }

    // 관리자 여부 확인
    isAdmin() {
        return this.currentUser && this.currentUser.isAdmin === true;
    }

    // 로그인 여부 확인
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // 사용자 목록 가져오기 (관리자 전용)
    getAllUsers() {
        if (!this.isAdmin()) {
            throw new Error('관리자 권한이 필요합니다.');
        }
        return this.users;
    }

    // 사용자 삭제 (관리자 전용)
    deleteUser(userId) {
        if (!this.isAdmin()) {
            throw new Error('관리자 권한이 필요합니다.');
        }

        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }

        // 관리자 계정은 삭제 불가
        if (this.users[userIndex].isAdmin) {
            throw new Error('관리자 계정은 삭제할 수 없습니다.');
        }

        this.users.splice(userIndex, 1);
        this.saveUsers();
    }

    // 사용자 데이터 저장
    saveUsers() {
        localStorage.setItem('gp-users', JSON.stringify(this.users));
    }

    // 통계 정보
    getStats() {
        return {
            totalUsers: this.users.length,
            adminUsers: this.users.filter(u => u.isAdmin).length,
            regularUsers: this.users.filter(u => !u.isAdmin).length
        };
    }
}
