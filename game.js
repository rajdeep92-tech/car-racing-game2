class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.unlockSystem = new CarUnlockSystem();
        this.setupCanvas();
        this.setupEventListeners();
        this.gameState = 'menu'; // menu, playing, finished
        this.selectedCar = null;
        this.selectedCity = null;
        this.position = 1; // Current race position
        this.countdown = 3; // Countdown before race starts
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    setupEventListeners() {
        // Car selection
        document.querySelectorAll('.car-option').forEach(option => {
            option.addEventListener('click', () => {
                const carType = parseInt(option.dataset.car);
                if (this.unlockSystem.isCarUnlocked(carType)) {
                    this.selectedCar = carType;
                    document.querySelectorAll('.car-option').forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                }
            });
        });

        // City selection
        document.querySelectorAll('.city-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectedCity = option.dataset.city;
                document.querySelectorAll('.city-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });

        // Start game button
        document.getElementById('start-game').addEventListener('click', () => {
            if (this.selectedCar && this.selectedCity) {
                this.startGame();
            } else {
                alert('Please select both a car and a city!');
            }
        });

        // Game controls
        document.addEventListener('keydown', (e) => {
            if (this.gameState === 'playing' && this.countdown === 0) {
                switch (e.key) {
                    case 'ArrowUp':
                        this.car.accelerate();
                        break;
                    case 'ArrowDown':
                        this.car.brake();
                        break;
                    case 'ArrowLeft':
                        this.car.moveLeft();
                        break;
                    case 'ArrowRight':
                        this.car.moveRight();
                        break;
                }
            }
        });
    }

    startGame() {
        this.gameState = 'playing';
        this.car = new Car(this.selectedCar);
        this.track = new Track(this.selectedCity);
        this.countdown = 3;
        
        // Hide menu and show game canvas
        document.getElementById('menu').style.display = 'none';
        this.canvas.style.display = 'block';
        document.getElementById('game-ui').classList.remove('hidden');

        // Start countdown
        this.startCountdown();
    }

    startCountdown() {
        const countdownInterval = setInterval(() => {
            if (this.countdown > 0) {
                this.countdown--;
                if (this.countdown === 0) {
                    clearInterval(countdownInterval);
                    // Start game loop after countdown
                    this.lastTime = performance.now();
                    requestAnimationFrame(this.gameLoop.bind(this));
                }
            }
        }, 1000);
    }

    updateRacePosition() {
        // Calculate position based on player's progress compared to AI cars
        let playerProgress = this.track.length - this.car.y;
        let position = 1;
        
        this.track.aiCars.forEach(aiCar => {
            const aiProgress = this.track.length - aiCar.y;
            if (aiProgress > playerProgress) {
                position++;
            }
        });
        
        this.position = position;
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Update
        if (this.gameState === 'playing') {
            if (this.countdown === 0) {
                this.car.update();
                this.track.updateAICars();
                this.track.updateOncomingTraffic(this.car.y);
                this.updateRacePosition();
                
                // Check for collisions with both AI cars and oncoming traffic
                if (this.track.checkCollision(this.car)) {
                    this.car.handleCollision();
                }

                // Update UI
                document.getElementById('current-speed').textContent = Math.round(this.car.speed);
                document.getElementById('distance').textContent = ((this.track.length - this.car.y) / 100).toFixed(1);

                // Check if race is finished
                if (this.car.y <= 0) {
                    this.finishGame();
                }
            }

            // Draw
            this.track.draw(this.ctx, this.car.y);
            this.car.draw(this.ctx);

            // Draw position
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Position: ${this.position}/5`, 20, 80);

            // Draw countdown if active
            if (this.countdown > 0) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 72px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(this.countdown, this.canvas.width / 2, this.canvas.height / 2);
                this.ctx.textAlign = 'left';
            }
        }

        // Continue game loop
        if (this.gameState === 'playing') {
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    finishGame() {
        this.gameState = 'finished';
        this.unlockSystem.incrementGamesPlayed();
        
        // Show finish message with position
        setTimeout(() => {
            alert(`Race Complete! You finished in position ${this.position}`);
            location.reload(); // Reload to return to menu
        }, 1000);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 