class FishDrawApp {
    constructor() {
        this.canvasDrawing = null;
        this.aiAnalyzer = null;
        this.firebaseManager = null;
        this.fishDatabase = null;
        this.isAnalyzing = false;
        
        this.init();
    }
    
    async init() {
        console.log('初始化 Draw A Fish 应用...');
        
        // 初始化各个组件
        this.initializeComponents();
        
        // 绑定事件监听器
        this.bindEventListeners();
        
        // 设置UI状态
        this.setupUI();
        
        console.log('应用初始化完成');
    }
    
    initializeComponents() {
        // 初始化绘画组件
        this.canvasDrawing = new CanvasDrawing('drawingCanvas');
        
        // 初始化AI分析器
        this.aiAnalyzer = new FishAIAnalyzer();
        
        // 初始化数据库管理器
        this.firebaseManager = new FirebaseManager();
        
        // 初始化鱼类数据库
        this.fishDatabase = new FishDatabase();
    }
    
    bindEventListeners() {
        // 画笔大小控制
        const brushSizeSlider = document.getElementById('brushSize');
        const brushSizeValue = document.getElementById('brushSizeValue');
        
        brushSizeSlider.addEventListener('input', (e) => {
            const size = e.target.value;
            this.canvasDrawing.setBrushSize(size);
            brushSizeValue.textContent = size;
        });
        
        // 颜色选择
        const colorButtons = document.querySelectorAll('.color-btn');
        colorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 移除其他按钮的active类
                colorButtons.forEach(b => b.classList.remove('active'));
                // 添加active类到当前按钮
                e.target.classList.add('active');
                // 设置画笔颜色
                const color = e.target.dataset.color;
                this.canvasDrawing.setColor(color);
            });
        });
        
        // 清除按钮
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearCanvas();
        });
        
        // 分析按钮
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeDrawing();
        });
        
        // 保存按钮
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveDrawing();
        });
        
        // 监听绘画完成事件
        const canvas = document.getElementById('drawingCanvas');
        canvas.addEventListener('drawingComplete', () => {
            this.onDrawingComplete();
        });
        
        // 监听模型加载事件
        document.addEventListener('modelLoaded', (e) => {
            this.onModelLoaded(e.detail);
        });
        
        document.addEventListener('modelLoadError', (e) => {
            this.onModelLoadError(e.detail);
        });
        
        // 窗口大小改变事件
        window.addEventListener('resize', () => {
            this.canvasDrawing.resize();
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }
    
    setupUI() {
        // 设置初始UI状态
        this.updateAnalyzeButton(false);
        this.showMessage('欢迎使用 Draw A Fish！开始画一条鱼吧！', 'info');
    }
    
    clearCanvas() {
        this.canvasDrawing.clear();
        this.resetAnalysisResult();
        this.showMessage('画布已清除', 'info');
    }
    
    async analyzeDrawing() {
        if (this.isAnalyzing) {
            return;
        }
        
        // 检查画布是否为空
        if (this.canvasDrawing.isEmpty()) {
            this.showMessage('请先画一条鱼再进行分析', 'error');
            return;
        }
        
        // 检查AI模型状态
        const modelStatus = this.aiAnalyzer.getModelStatus();
        if (!modelStatus.isLoaded) {
            this.showMessage('AI模型正在加载中，请稍后再试', 'error');
            return;
        }
        
        this.isAnalyzing = true;
        this.updateAnalyzeButton(true);
        this.showAnalysisLoading();
        
        try {
            // 获取图像数据
            const imageData = this.canvasDrawing.getImageDataForAnalysis();
            
            // 进行AI分析
            const result = await this.aiAnalyzer.analyzeDrawing(imageData);
            
            // 显示分析结果
            this.displayAnalysisResult(result);
            
            this.showMessage('分析完成！', 'success');
            
        } catch (error) {
            console.error('分析失败:', error);
            this.showMessage('分析失败: ' + error.message, 'error');
            this.resetAnalysisResult();
        } finally {
            this.isAnalyzing = false;
            this.updateAnalyzeButton(false);
        }
    }
    
    async saveDrawing() {
        try {
            // 检查画布是否为空
            if (this.canvasDrawing.isEmpty()) {
                this.showMessage('没有可保存的绘画内容', 'error');
                return;
            }
            
            const imageData = this.canvasDrawing.getImageData();
            const analysisResult = this.getCurrentAnalysisResult();
            
            const drawingData = {
                imageData: imageData,
                analysisResult: analysisResult
            };
            
            // 保存到数据库
            const recordId = await this.firebaseManager.saveDrawing(drawingData);
            
            // 同时下载图片
            this.canvasDrawing.downloadImage(`fish-drawing-${Date.now()}.png`);
            
            this.showMessage('绘画已保存！', 'success');
            
        } catch (error) {
            console.error('保存失败:', error);
            this.showMessage('保存失败: ' + error.message, 'error');
        }
    }
    
    onDrawingComplete() {
        // 绘画完成时的处理
        this.updateAnalyzeButton(false);
    }
    
    onModelLoaded(detail) {
        if (detail.success) {
            this.showMessage('AI模型加载完成，可以开始分析了！', 'success');
        }
    }
    
    onModelLoadError(detail) {
        this.showMessage('AI模型加载失败: ' + detail.error, 'error');
    }
    
    updateAnalyzeButton(isAnalyzing) {
        const btn = document.getElementById('analyzeBtn');
        if (isAnalyzing) {
            btn.innerHTML = '<span class="loading"></span> 分析中...';
            btn.disabled = true;
        } else {
            btn.innerHTML = '分析鱼类';
            btn.disabled = this.canvasDrawing.isEmpty();
        }
    }
    
    showAnalysisLoading() {
        const resultDiv = document.getElementById('analysisResult');
        resultDiv.innerHTML = `
            <div style="text-align: center;">
                <div class="loading"></div>
                <p>AI正在分析您的绘画...</p>
            </div>
        `;
    }
    
    displayAnalysisResult(result) {
        const resultDiv = document.getElementById('analysisResult');
        const scoreValue = document.getElementById('scoreValue');
        
        // 获取鱼类信息
        const fishInfo = this.fishDatabase.getFishInfo(result.fishType);
        
        resultDiv.innerHTML = `
            <div class="analysis-content">
                <h4>🐠 识别结果: ${result.fishType}</h4>
                <p><strong>置信度:</strong> ${Math.round(result.confidence * 100)}%</p>
                <p><strong>描述:</strong> ${fishInfo.description}</p>
                <div class="characteristics">
                    <strong>特征:</strong>
                    <ul>
                        ${fishInfo.characteristics.map(char => `<li>${char}</li>`).join('')}
                    </ul>
                </div>
                <div class="suggestions">
                    <strong>建议:</strong>
                    <ul>
                        ${result.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
                <div class="features-info">
                    <small>
                        绘画覆盖率: ${result.features.coverage}% | 
                        复杂度: ${result.features.complexity}% | 
                        笔画数: ${result.features.strokeCount}
                    </small>
                </div>
            </div>
        `;
        
        // 更新分数显示
        scoreValue.textContent = result.score;
        scoreValue.style.color = this.getScoreColor(result.score);
    }
    
    resetAnalysisResult() {
        const resultDiv = document.getElementById('analysisResult');
        const scoreValue = document.getElementById('scoreValue');
        
        resultDiv.innerHTML = '<p>画完鱼后点击"分析鱼类"按钮</p>';
        scoreValue.textContent = '--';
        scoreValue.style.color = '#667eea';
    }
    
    getCurrentAnalysisResult() {
        // 从UI获取当前的分析结果
        const resultDiv = document.getElementById('analysisResult');
        if (resultDiv.querySelector('.analysis-content')) {
            const scoreValue = document.getElementById('scoreValue').textContent;
            return {
                score: scoreValue !== '--' ? parseInt(scoreValue) : null,
                timestamp: new Date().toISOString()
            };
        }
        return null;
    }
    
    getScoreColor(score) {
        if (score >= 80) return '#38a169'; // 绿色
        if (score >= 60) return '#ed8936'; // 橙色
        if (score >= 40) return '#e53e3e'; // 红色
        return '#718096'; // 灰色
    }
    
    showMessage(message, type = 'info') {
        // 创建消息提示
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}-message`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            transition: all 0.3s ease;
            max-width: 300px;
        `;
        
        // 设置背景色
        const colors = {
            success: '#38a169',
            error: '#e53e3e',
            info: '#667eea'
        };
        messageEl.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(messageEl);
        
        // 3秒后自动移除
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }
    
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Z: 清除画布
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            this.clearCanvas();
        }
        
        // 空格键: 分析绘画
        if (e.code === 'Space' && !this.isAnalyzing) {
            e.preventDefault();
            this.analyzeDrawing();
        }
        
        // Ctrl/Cmd + S: 保存绘画
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveDrawing();
        }
        
        // 数字键1-7: 选择颜色
        const colorKeys = ['1', '2', '3', '4', '5', '6', '7'];
        if (colorKeys.includes(e.key)) {
            e.preventDefault();
            const colorBtns = document.querySelectorAll('.color-btn');
            const index = parseInt(e.key) - 1;
            if (colorBtns[index]) {
                colorBtns[index].click();
            }
        }
    }
    
    // 获取应用统计信息
    async getAppStatistics() {
        try {
            const stats = await this.firebaseManager.getStatistics();
            const modelStatus = this.aiAnalyzer.getModelStatus();
            const dbStatus = this.firebaseManager.getStatus();
            
            return {
                ...stats,
                modelStatus,
                databaseStatus: dbStatus
            };
        } catch (error) {
            console.error('获取统计信息失败:', error);
            return null;
        }
    }
    
    // 显示帮助信息
    showHelp() {
        const helpMessage = `
            🎨 Draw A Fish 使用指南:
            
            绘画控制:
            • 鼠标拖拽或触摸绘制
            • 调节画笔大小和颜色
            
            快捷键:
            • 空格键: 分析绘画
            • Ctrl+Z: 清除画布
            • Ctrl+S: 保存绘画
            • 数字键1-7: 选择颜色
            
            功能:
            • AI鱼类识别和评分
            • 绘画记录保存
            • 本地数据存储
        `;
        
        alert(helpMessage);
    }
}

// 等待DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 初始化应用
    window.fishDrawApp = new FishDrawApp();
    
    // 添加帮助按钮（如果需要）
    const helpBtn = document.createElement('button');
    helpBtn.innerHTML = '?';
    helpBtn.className = 'help-btn';
    helpBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background: #667eea;
        color: white;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
    `;
    
    helpBtn.addEventListener('click', () => {
        window.fishDrawApp.showHelp();
    });
    
    document.body.appendChild(helpBtn);
    
    console.log('🐠 Draw A Fish 应用已启动！');
});