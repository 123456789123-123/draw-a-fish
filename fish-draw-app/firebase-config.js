class FirebaseManager {
    constructor() {
        this.isInitialized = false;
        this.db = null;
        this.useMockData = true; // 默认使用模拟数据
        this.mockStorage = [];
        this.init();
    }
    
    async init() {
        try {
            // 模拟Firebase初始化
            console.log('正在初始化数据存储...');
            
            // 模拟初始化延迟
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.isInitialized = true;
            console.log('数据存储初始化完成 (模拟模式)');
            
            // 加载本地存储的数据
            this.loadLocalData();
            
        } catch (error) {
            console.error('数据存储初始化失败:', error);
        }
    }
    
    loadLocalData() {
        try {
            const savedData = localStorage.getItem('fishDrawings');
            if (savedData) {
                this.mockStorage = JSON.parse(savedData);
                console.log(`加载了 ${this.mockStorage.length} 个本地绘画记录`);
            }
        } catch (error) {
            console.error('加载本地数据失败:', error);
            this.mockStorage = [];
        }
    }
    
    saveLocalData() {
        try {
            localStorage.setItem('fishDrawings', JSON.stringify(this.mockStorage));
        } catch (error) {
            console.error('保存本地数据失败:', error);
        }
    }
    
    async saveDrawing(drawingData) {
        if (!this.isInitialized) {
            throw new Error('数据存储尚未初始化');
        }
        
        try {
            const record = {
                id: this.generateId(),
                timestamp: new Date().toISOString(),
                imageData: drawingData.imageData,
                analysisResult: drawingData.analysisResult,
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            };
            
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.mockStorage.push(record);
            this.saveLocalData();
            
            console.log('绘画记录已保存:', record.id);
            return record.id;
            
        } catch (error) {
            console.error('保存绘画记录失败:', error);
            throw error;
        }
    }
    
    async getDrawingHistory(limit = 10) {
        if (!this.isInitialized) {
            throw new Error('数据存储尚未初始化');
        }
        
        try {
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 返回最近的记录
            const recent = this.mockStorage
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
                
            return recent;
            
        } catch (error) {
            console.error('获取绘画历史失败:', error);
            throw error;
        }
    }
    
    async getStatistics() {
        if (!this.isInitialized) {
            throw new Error('数据存储尚未初始化');
        }
        
        try {
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const total = this.mockStorage.length;
            const today = new Date().toDateString();
            const todayCount = this.mockStorage.filter(record => 
                new Date(record.timestamp).toDateString() === today
            ).length;
            
            // 计算平均分数
            const scores = this.mockStorage
                .filter(record => record.analysisResult && record.analysisResult.score)
                .map(record => record.analysisResult.score);
            const averageScore = scores.length > 0 ? 
                Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            
            // 最受欢迎的鱼类
            const fishTypes = this.mockStorage
                .filter(record => record.analysisResult && record.analysisResult.fishType)
                .map(record => record.analysisResult.fishType);
            
            const fishTypeCount = {};
            fishTypes.forEach(type => {
                fishTypeCount[type] = (fishTypeCount[type] || 0) + 1;
            });
            
            const popularFish = Object.entries(fishTypeCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3);
            
            return {
                totalDrawings: total,
                todayDrawings: todayCount,
                averageScore,
                popularFishTypes: popularFish,
                lastDrawing: total > 0 ? this.mockStorage[this.mockStorage.length - 1].timestamp : null
            };
            
        } catch (error) {
            console.error('获取统计数据失败:', error);
            throw error;
        }
    }
    
    async deleteDrawing(id) {
        if (!this.isInitialized) {
            throw new Error('数据存储尚未初始化');
        }
        
        try {
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const index = this.mockStorage.findIndex(record => record.id === id);
            if (index !== -1) {
                this.mockStorage.splice(index, 1);
                this.saveLocalData();
                console.log('绘画记录已删除:', id);
                return true;
            } else {
                throw new Error('未找到指定的绘画记录');
            }
            
        } catch (error) {
            console.error('删除绘画记录失败:', error);
            throw error;
        }
    }
    
    async clearAllData() {
        if (!this.isInitialized) {
            throw new Error('数据存储尚未初始化');
        }
        
        try {
            this.mockStorage = [];
            localStorage.removeItem('fishDrawings');
            console.log('所有绘画记录已清除');
            return true;
            
        } catch (error) {
            console.error('清除数据失败:', error);
            throw error;
        }
    }
    
    generateId() {
        return 'drawing_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // 获取服务状态
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            mode: this.useMockData ? 'offline' : 'online',
            recordCount: this.mockStorage.length
        };
    }
    
    // 导出数据
    exportData() {
        return {
            exportDate: new Date().toISOString(),
            version: '1.0',
            data: this.mockStorage
        };
    }
    
    // 导入数据
    async importData(exportedData) {
        try {
            if (exportedData && exportedData.data && Array.isArray(exportedData.data)) {
                this.mockStorage = [...this.mockStorage, ...exportedData.data];
                this.saveLocalData();
                console.log(`导入了 ${exportedData.data.length} 个绘画记录`);
                return true;
            } else {
                throw new Error('无效的导入数据格式');
            }
        } catch (error) {
            console.error('导入数据失败:', error);
            throw error;
        }
    }
}

// 实际的Firebase配置（当需要真实Firebase时取消注释）
/*
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// 初始化Firebase（当需要真实Firebase时取消注释）
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
*/

// 导出管理器
window.FirebaseManager = FirebaseManager;