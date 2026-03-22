export function initLandingAnimation(canvasId, containerId) {
    const canvas = document.getElementById(canvasId);
    const container = document.getElementById(containerId);
    
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let animationFrameId;
    
    // Configuration
    const gridSize = 40;
    const pathCount = 15;
    const paths = [];
    const colors = ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f']; // Red, Green, Blue, Yellow

    // Resize handler
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    
    window.addEventListener('resize', resize);
    resize();

    class Path {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.floor(Math.random() * (width / gridSize)) * gridSize;
            this.y = Math.floor(Math.random() * (height / gridSize)) * gridSize;
            this.history = [];
            this.length = Math.floor(Math.random() * 20) + 10;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.speed = Math.floor(Math.random() * 2) + 2; // Speed in pixels per frame
            this.direction = Math.floor(Math.random() * 4); // 0: up, 1: right, 2: down, 3: left
            this.life = 0;
            this.maxLife = Math.random() * 200 + 100;
            
            // Snap to grid
            this.currentX = this.x;
            this.currentY = this.y;
            this.targetX = this.x;
            this.targetY = this.y;
            this.moving = false;
        }

        update() {
            this.life++;
            if (this.life > this.maxLife) {
                this.reset();
                return;
            }

            if (!this.moving) {
                // Decide new direction
                if (Math.random() < 0.1) {
                    this.direction = Math.floor(Math.random() * 4);
                }
                
                let nextX = this.x;
                let nextY = this.y;

                if (this.direction === 0) nextY -= gridSize;
                if (this.direction === 1) nextX += gridSize;
                if (this.direction === 2) nextY += gridSize;
                if (this.direction === 3) nextX -= gridSize;

                // Bounds check
                if (nextX < 0 || nextX > width || nextY < 0 || nextY > height) {
                    this.reset();
                    return;
                }

                this.targetX = nextX;
                this.targetY = nextY;
                this.moving = true;
                
                // Add to history
                this.history.push({x: this.x, y: this.y});
                if (this.history.length > this.length) {
                    this.history.shift();
                }
            }

            // Move towards target
            const speed = 4; // px per update
            if (this.currentX < this.targetX) this.currentX += speed;
            if (this.currentX > this.targetX) this.currentX -= speed;
            if (this.currentY < this.targetY) this.currentY += speed;
            if (this.currentY > this.targetY) this.currentY -= speed;

            // Check if reached
            if (Math.abs(this.currentX - this.targetX) < speed && Math.abs(this.currentY - this.targetY) < speed) {
                this.currentX = this.targetX;
                this.currentY = this.targetY;
                this.x = this.targetX;
                this.y = this.targetY;
                this.moving = false;
            }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;
            
            // Draw trail
            if (this.history.length > 0) {
                ctx.moveTo(this.history[0].x, this.history[0].y);
                for (let i = 1; i < this.history.length; i++) {
                    ctx.lineTo(this.history[i].x, this.history[i].y);
                }
                ctx.lineTo(this.currentX, this.currentY);
            }
            
            ctx.strokeStyle = this.color;
            ctx.stroke();
            
            // Draw head
            ctx.beginPath();
            ctx.fillStyle = '#fff';
            ctx.arc(this.currentX, this.currentY, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Initialize paths
    for (let i = 0; i < pathCount; i++) {
        paths.push(new Path());
    }

    function animate() {
        // Clear with fade effect for trails (optional, but we use history based clearing here)
        ctx.clearRect(0, 0, width, height);

        // Draw Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Update and draw paths
        paths.forEach(path => {
            path.update();
            path.draw(ctx);
        });

        animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return {
        stop: () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        }
    };
}
