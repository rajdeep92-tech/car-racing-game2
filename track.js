class Track {
    constructor(city) {
        this.city = city;
        this.length = 100000; // Increased to 100 km (10x the original 10km)
        this.width = 800;
        this.laneWidth = 150;
        this.background = new Image();
        this.background.src = `assets/${city}.svg`;
        this.aiCars = this.generateAICars();
        this.oncomingCars = [];
        this.lastOncomingCarTime = 0;
        this.oncomingCarInterval = 3000; // New car every 3 seconds
        this.trackProperties = this.getTrackProperties();
    }

    getTrackProperties() {
        switch (this.city) {
            case 'newyork':
                return {
                    traffic: 'heavy',
                    turns: 'moderate',
                    weather: 'clear',
                    difficulty: 0.8
                };
            case 'bangalore':
                return {
                    traffic: 'very heavy',
                    turns: 'many',
                    weather: 'clear',
                    difficulty: 1.0
                };
            default:
                return {
                    traffic: 'moderate',
                    turns: 'few',
                    weather: 'clear',
                    difficulty: 0.7
                };
        }
    }

    generateAICars() {
        const aiCars = [];
        // Create 4 AI cars, each in their own lane
        for (let i = 0; i < 4; i++) {
            const carType = Math.floor(Math.random() * 3) + 1; // Random car type 1-3
            const car = new Car(carType, true);
            car.lane = i; // Assign each AI car to a specific lane
            car.x = 150 + (i * this.laneWidth); // Position in their assigned lane
            car.y = window.innerHeight - 100; // Same starting line as player
            aiCars.push(car);
        }
        return aiCars;
    }

    generateOncomingCar() {
        const carType = Math.floor(Math.random() * 3) + 1;
        const car = new Car(carType, true);
        car.isOncoming = true;
        car.lane = Math.floor(Math.random() * 4); // Random lane
        car.x = 150 + (car.lane * this.laneWidth);
        car.y = -100; // Start above the screen
        car.speed = 150 + Math.random() * 50; // Speed between 150-200
        return car;
    }

    updateOncomingTraffic(playerY) {
        const currentTime = performance.now();
        
        // Generate new oncoming car
        if (currentTime - this.lastOncomingCarTime > this.oncomingCarInterval) {
            this.oncomingCars.push(this.generateOncomingCar());
            this.lastOncomingCarTime = currentTime;
        }

        // Update oncoming cars
        this.oncomingCars.forEach(car => {
            car.y += car.speed * 0.1; // Move downward
        });

        // Remove cars that are off screen
        this.oncomingCars = this.oncomingCars.filter(car => car.y < window.innerHeight + 200);
    }

    updateAICars() {
        this.aiCars.forEach(car => {
            // Check for oncoming cars in the same lane
            const oncomingInLane = this.oncomingCars.find(
                oncoming => oncoming.lane === car.lane && 
                Math.abs(oncoming.y - car.y) < 300
            );

            if (oncomingInLane) {
                // Try to change lane if possible
                const newLane = this.findSafeLane(car);
                if (newLane !== car.lane) {
                    car.lane = newLane;
                    car.x = 150 + (car.lane * this.laneWidth);
                }
            }

            car.update();
            
            // Check collisions between AI cars
            this.aiCars.forEach(otherCar => {
                if (car !== otherCar && this.checkCarCollision(car, otherCar)) {
                    car.handleCollision();
                    otherCar.handleCollision();
                }
            });
        });
    }

    findSafeLane(car) {
        const possibleLanes = [0, 1, 2, 3].filter(lane => 
            lane !== car.lane && 
            !this.isLaneOccupied(lane, car.y)
        );
        
        return possibleLanes.length > 0 ? 
            possibleLanes[Math.floor(Math.random() * possibleLanes.length)] : 
            car.lane;
    }

    isLaneOccupied(lane, y) {
        return this.aiCars.some(car => 
            car.lane === lane && Math.abs(car.y - y) < 200
        ) || this.oncomingCars.some(car => 
            car.lane === lane && Math.abs(car.y - y) < 200
        );
    }

    draw(ctx, playerY) {
        // Clear canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Calculate background position for vertical scrolling
        const backgroundY = -(playerY * 0.5) % ctx.canvas.height;
        
        // Draw two background images for seamless scrolling
        ctx.drawImage(this.background, 0, backgroundY, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(this.background, 0, backgroundY + ctx.canvas.height, ctx.canvas.width, ctx.canvas.height);

        // Draw road
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(100, 0, 600, ctx.canvas.height);

        // Draw lane markers
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([20, 20]);
        for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(100 + (i * this.laneWidth), 0);
            ctx.lineTo(100 + (i * this.laneWidth), ctx.canvas.height);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Draw AI cars with collision boxes
        this.aiCars.forEach(car => {
            car.draw(ctx);
            
            // Draw collision box for AI cars
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(car.x, car.y, 50, 30);
        });

        // Draw oncoming cars with red collision boxes
        this.oncomingCars.forEach(car => {
            car.draw(ctx);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(car.x, car.y, 50, 30);
        });

        // Draw finish line
        if (this.length - playerY < ctx.canvas.height) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(100, this.length - playerY, 600, 10);
        }
    }

    checkCarCollision(car1, car2) {
        const carWidth = 50;
        const carHeight = 30;
        const collisionBuffer = 5; // Add a small buffer for more forgiving collisions
        
        // Get the actual bounds for both cars
        const car1Bounds = {
            left: car1.x + collisionBuffer,
            right: car1.x + carWidth - collisionBuffer,
            top: car1.y + collisionBuffer,
            bottom: car1.y + carHeight - collisionBuffer
        };
        
        const car2Bounds = {
            left: car2.x + collisionBuffer,
            right: car2.x + carWidth - collisionBuffer,
            top: car2.y + collisionBuffer,
            bottom: car2.y + carHeight - collisionBuffer
        };

        // Check for collision
        return !(
            car1Bounds.right < car2Bounds.left ||
            car1Bounds.left > car2Bounds.right ||
            car1Bounds.bottom < car2Bounds.top ||
            car1Bounds.top > car2Bounds.bottom
        );
    }

    checkCollision(playerCar) {
        const hasAICollision = this.aiCars.some(aiCar => 
            this.checkCarCollision(playerCar, aiCar)
        );
        
        const hasOncomingCollision = this.oncomingCars.some(oncomingCar => 
            this.checkCarCollision(playerCar, oncomingCar)
        );
        
        if (hasAICollision || hasOncomingCollision) {
            console.log('Collision detected!');
        }
        
        return hasAICollision || hasOncomingCollision;
    }
} 