// 갤러리 관리 모듈
class GalleryManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.galleries = JSON.parse(localStorage.getItem('gp-galleries') || '[]');
        this.currentGallery = null;
        
        // 기본 갤러리가 없으면 생성
        if (this.galleries.length === 0) {
            this.createDefaultGalleries();
        }
    }

    // 갤러리 생성 (관리자 전용)
    createGallery(name, description) {
        if (!this.authManager.isAdmin()) {
            throw new Error('갤러리 생성은 관리자만 가능합니다.');
        }

        if (!name || name.trim().length === 0) {
            throw new Error('갤러리 이름을 입력해주세요.');
        }

        // 중복 검사
        if (this.galleries.find(g => g.name === name.trim())) {
            throw new Error('이미 존재하는 갤러리 이름입니다.');
        }

        const gallery = {
            id: Date.now().toString(),
            name: name.trim(),
            description: description ? description.trim() : '갤러리 설명이 없습니다.',
            creator: this.authManager.getCurrentUser().nickname,
            createdAt: new Date().toISOString(),
            postCount: 0,
            lastActivity: new Date().toISOString()
        };

        this.galleries.push(gallery);
        this.saveGalleries();
        
        return gallery;
    }

    // 갤러리 삭제 (관리자 전용)
    deleteGallery(galleryId) {
        if (!this.authManager.isAdmin()) {
            throw new Error('갤러리 삭제는 관리자만 가능합니다.');
        }

        const galleryIndex = this.galleries.findIndex(g => g.id === galleryId);
        if (galleryIndex === -1) {
            throw new Error('갤러리를 찾을 수 없습니다.');
        }

        this.galleries.splice(galleryIndex, 1);
        this.saveGalleries();
    }

    // 갤러리 목록 가져오기
    getAllGalleries() {
        return this.galleries;
    }

    // 갤러리 검색
    searchGalleries(searchTerm) {
        if (!searchTerm) return this.galleries;

        const term = searchTerm.toLowerCase();
        return this.galleries.filter(gallery =>
            gallery.name.toLowerCase().includes(term) ||
            gallery.description.toLowerCase().includes(term)
        );
    }

    // 갤러리 가져오기
    getGallery(galleryId) {
        return this.galleries.find(g => g.id === galleryId);
    }

    // 현재 갤러리 설정
    setCurrentGallery(galleryId) {
        this.currentGallery = this.getGallery(galleryId);
        return this.currentGallery;
    }

    // 현재 갤러리 가져오기
    getCurrentGallery() {
        return this.currentGallery;
    }

    // 갤러리 통계 업데이트
    updateGalleryStats(galleryId, postCountChange = 0) {
        const gallery = this.getGallery(galleryId);
        if (gallery) {
            gallery.postCount = Math.max(0, gallery.postCount + postCountChange);
            gallery.lastActivity = new Date().toISOString();
            this.saveGalleries();
        }
    }

    // 갤러리 데이터 저장
    saveGalleries() {
        localStorage.setItem('gp-galleries', JSON.stringify(this.galleries));
    }

    // 기본 갤러리 생성
    createDefaultGalleries() {
        const defaultGalleries = [
            {
                id: 'free',
                name: '자유게시판',
                description: '자유롭게 이야기를 나누는 공간입니다.',
                creator: '관리자',
                createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
                postCount: 1,
                lastActivity: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: 'tech',
                name: '기술게시판',
                description: '프로그래밍과 기술에 대해 토론하는 공간입니다.',
                creator: '관리자',
                createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
                postCount: 0,
                lastActivity: new Date(Date.now() - 7200000).toISOString()
            },
            {
                id: 'humor',
                name: '유머게시판',
                description: '재미있는 이야기와 유머를 공유하는 공간입니다.',
                creator: '관리자',
                createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
                postCount: 0,
                lastActivity: new Date(Date.now() - 10800000).toISOString()
            },
            {
                id: 'notice',
                name: '공지사항',
                description: '중요한 공지사항을 확인하는 공간입니다.',
                creator: '관리자',
                createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
                postCount: 0,
                lastActivity: new Date(Date.now() - 86400000).toISOString()
            }
        ];

        this.galleries = defaultGalleries;
        this.saveGalleries();
    }

    // 갤러리 통계
    getStats() {
        return {
            totalGalleries: this.galleries.length,
            totalPosts: this.galleries.reduce((sum, g) => sum + g.postCount, 0),
            mostActiveGallery: this.galleries.sort((a, b) => b.postCount - a.postCount)[0]
        };
    }
}
