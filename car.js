class Car {
    constructor(type, isAI = false) {
        this.type = type;
        this.isAI = isAI;
        this.isOncoming = false;
        this.lane = 2;
        this.x = 150 + (this.lane * 150);
        this.y = window.innerHeight - 100;
        this.speed = 0;
        this.acceleration = 0;
        this.maxSpeed = this.getMaxSpeed();
        this.handling = this.getHandling();
        this.image = new Image();
        this.image.src = `assets/car${type}.svg`;
        this.damaged = false;
        this.collisionCooldown = 0;
        this.lastCollisionTime = 0;
        this.lastLaneChange = 0;
        this.laneChangeCooldown = 1000;
        
        // Set initial speed for AI cars
        if (isAI) {
            this.speed = 0; // Start at 0 speed for fair start
        }
    }

    getMaxSpeed() {
        // Adjusted speeds: reduced AI speeds, kept player speeds high
        switch (this.type) {
            case 1:
                return this.isAI ? 150 : 300; // Basic car
            case 2:
                return this.isAI ? 180 : 350; // Sports car
            case 3:
                return this.isAI ? 200 : 400; // Super car
            default:
                return this.isAI ? 150 : 300;
        }
    }

    getHandling() {
        // Improved handling for player cars
        switch (this.type) {
            case 1:
                return this.isAI ? 0.85 : 1.0; // Basic car handling
            case 2:
                return this.isAI ? 0.92 : 1.1; // Sports car handling
            case 3:
                return this.isAI ? 1.0 : 1.2; // Super car handling
            default:
                return this.isAI ? 0.85 : 1.0;
        }
    }

    accelerate() {
        if (this.speed < this.maxSpeed) {
            if (this.isAI) {
                // Slower acceleration for AI cars
                this.acceleration = 0.5 * this.handling;
                this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
            } else {
                // Much faster acceleration for player
                this.acceleration = 2.5 * this.handling;
                this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
                
                // Additional boost at low speeds to prevent slow start
                if (this.speed < 100) {
                    this.speed += this.acceleration * 1.5;
                }
            }
        }
    }

    brake() {
        if (this.speed > 0) {
            if (this.isAI) {
                this.speed = Math.max(0, this.speed - 1);
            } else {
                // Stronger braking for player
                this.speed = Math.max(0, this.speed - 4);
            }
        }
    }

    moveLeft() {
        if (!this.isAI && this.lane > 0 && this.collisionCooldown === 0) {
            this.lane--;
            this.x = 150 + (this.lane * 150);
        }
    }

    moveRight() {
        if (!this.isAI && this.lane < 3 && this.collisionCooldown === 0) {
            this.lane++;
            this.x = 150 + (this.lane * 150);
        }
    }

    handleCollision() {
        const currentTime = performance.now();
        if (this.collisionCooldown === 0) {
            console.log(`${this.isAI ? 'AI' : 'Player'} car collision at speed: ${this.speed.toFixed(1)} km/h`);
            this.speed *= 0.3; // Bigger speed reduction on collision
            this.damaged = true;
            this.collisionCooldown = 30; // Frames of collision cooldown
            this.lastCollisionTime = currentTime;
        }
    }

    update() {
        if (this.isOncoming) {
            this.y += this.speed * 0.1; // Move downward
        } else {
            this.y -= this.speed * 0.1; // Move upward
        }
        
        if (this.collisionCooldown > 0) {
            this.collisionCooldown--;
        }

        // AI behavior
        if (this.isAI && !this.isOncoming) {
            this.accelerate();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw collision box
        if (!this.isAI) {
            ctx.strokeStyle = this.damaged ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(-25, -15, 50, 30);
        }
        
        // Add visual effect for damaged state
        if (this.damaged) {
            ctx.globalAlpha = 0.7;
            if (this.collisionCooldown % 4 < 2) {
                ctx.globalAlpha = 0.9;
            }
            
            const timeSinceCollision = performance.now() - this.lastCollisionTime;
            if (timeSinceCollision < 500) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(-25, -15, 50, 30);
            }
        }
        
        // Rotate the car based on direction
        ctx.rotate(this.isOncoming ? Math.PI / 2 : -Math.PI / 2);
        
        // Draw car shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-17, -27, 34, 54);
        
        // Draw the car
        ctx.drawImage(this.image, -15, -25, 30, 50);
        
        // Draw speed lines
        if (this.speed > 100) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-15 + (i * 15), this.isOncoming ? -30 : 30);
                ctx.lineTo(-15 + (i * 15), this.isOncoming ? 
                    -(30 + (this.speed * 0.1)) : 
                    30 + (this.speed * 0.1));
                ctx.stroke();
            }
        }
        
        ctx.restore();
        
        if (this.collisionCooldown === 0) {
            this.damaged = false;
        }
    }
}

// Car unlock system
class CarUnlockSystem {
    constructor() {
        this.gamesPlayed = 0;
        this.unlockedCars = [1]; // Start with car 1 unlocked
    }

    incrementGamesPlayed() {
        this.gamesPlayed++;
        this.checkUnlocks();
    }

    checkUnlocks() {
        if (this.gamesPlayed >= 3 && !this.unlockedCars.includes(2)) {
            this.unlockedCars.push(2);
        }
        if (this.gamesPlayed >= 6 && !this.unlockedCars.includes(3)) {
            this.unlockedCars.push(3);
        }
    }

    isCarUnlocked(carType) {
        return this.unlockedCars.includes(carType);
    }
} 