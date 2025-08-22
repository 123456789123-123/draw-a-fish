class CanvasDrawing {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentColor = '#000000';
        this.currentBrushSize = 5;
        this.lastX = 0;
        this.lastY = 0;
        
        this.setupCanvas();
        this.bindEvents();
    }
    
    setupCanvas() {
        // 设置Canvas高DPI支持
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // 设置绘画属性
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.currentBrushSize;
    }
    
    bindEvents() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // 触摸事件（移动设备支持）
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        
        // 防止滚动
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }
    
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            // 触发绘画完成事件
            this.canvas.dispatchEvent(new CustomEvent('drawingComplete'));
        }
    }
    
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                        e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    setColor(color) {
        this.currentColor = color;
        this.ctx.strokeStyle = color;
    }
    
    setBrushSize(size) {
        this.currentBrushSize = size;
        this.ctx.lineWidth = size;
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // 触发清除完成事件
        this.canvas.dispatchEvent(new CustomEvent('canvasCleared'));
    }
    
    getImageData() {
        return this.canvas.toDataURL('image/png');
    }
    
    getImageDataForAnalysis() {
        // 返回适合AI分析的图像数据
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        return {
            data: imageData.data,
            width: imageData.width,
            height: imageData.height
        };
    }
    
    // 保存绘画为文件
    downloadImage(filename = 'my-fish-drawing.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    // 检查画布是否为空
    isEmpty() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        return !imageData.data.some(channel => channel !== 0);
    }
    
    // 获取绘画的边界框
    getBoundingBox() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        let minX = this.canvas.width, minY = this.canvas.height;
        let maxX = 0, maxY = 0;
        
        for (let y = 0; y < this.canvas.height; y++) {
            for (let x = 0; x < this.canvas.width; x++) {
                const alpha = data[(y * this.canvas.width + x) * 4 + 3];
                if (alpha > 0) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    // 调整画布大小
    resize() {
        const imageData = this.getImageData();
        this.setupCanvas();
        
        // 重新绘制图像
        const img = new Image();
        img.onload = () => {
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = imageData;
    }
}

// 导出类以供其他文件使用
window.CanvasDrawing = CanvasDrawing;