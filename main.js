document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const resultDisplay = document.getElementById('resultDisplay');
    const retryButton = document.getElementById('retryButton');

    const CANVAS_WIDTH = canvas.width;
    const CANVAS_HEIGHT = canvas.height;
    const NUM_NPCS = 5;
    const NPC_HP_INITIAL = 100;
    const NPC_ATTACK_POWER = 10;
    const NPC_SPEED = 1; // Pixels per frame
    const NPC_RADIUS = 10; // Visual size

    const RANGE_SHORT = 30;
    const RANGE_LONG = 100;

    let npcs = [];
    let gameLoopId = null;
    let gameOver = false;

    // --- NPC Class/Object Factory ---
    class NPC {
        constructor(id, name) {
            this.id = id;
            this.name = name;
            this.hp = NPC_HP_INITIAL;
            this.alive = true;
            this.x = Math.random() * (CANVAS_WIDTH - NPC_RADIUS * 2) + NPC_RADIUS;
            this.y = Math.random() * (CANVAS_HEIGHT - NPC_RADIUS * 2) + NPC_RADIUS;

            const personalityTypes = ['aggressive', 'evasive'];
            const rangeTypes = ['short', 'long'];
            this.personalityType = personalityTypes[Math.floor(Math.random() * personalityTypes.length)];
            this.rangeType = rangeTypes[Math.floor(Math.random() * rangeTypes.length)];

            this.attackRange = (this.rangeType === 'short') ? RANGE_SHORT : RANGE_LONG;
            this.color = `rgb(${Math.floor(Math.random()*200)+55}, ${Math.floor(Math.random()*200)+55}, ${Math.floor(Math.random()*200)+55})`; // Brighter colors
            this.targetId = null;
            this.targetNpc = null; // Store the actual target object
        }

        findTarget(allNpcs) {
            if (!this.alive) return;
            let closestDistance = Infinity;
            let potentialTarget = null;

            for (const otherNpc of allNpcs) {
                if (!otherNpc.alive || otherNpc.id === this.id) continue;

                const distance = Math.sqrt((this.x - otherNpc.x)**2 + (this.y - otherNpc.y)**2);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    potentialTarget = otherNpc;
                }
            }
            this.targetNpc = potentialTarget;
            if (this.targetNpc) {
                this.targetId = this.targetNpc.id;
            } else {
                this.targetId = null;
            }
        }

        move() {
            if (!this.alive || !this.targetNpc || !this.targetNpc.alive) return;

            const dx = this.targetNpc.x - this.x;
            const dy = this.targetNpc.y - this.y;
            const distance = Math.sqrt(dx*dx + dy*dy);

            if (distance === 0) return;

            const moveXUnit = (dx / distance);
            const moveYUnit = (dy / distance);

            if (this.personalityType === 'aggressive') {
                // Aggressive types move towards the target if outside effective attack range
                if (distance > this.attackRange * 0.8) {
                    this.x += moveXUnit * NPC_SPEED;
                    this.y += moveYUnit * NPC_SPEED;
                }
            } else { // evasive
                // Evasive types try to maintain optimal distance or flee if too close
                if (distance < this.attackRange * 0.5) { // Too close, actively flee
                    this.x -= moveXUnit * NPC_SPEED;
                    this.y -= moveYUnit * NPC_SPEED;
                } else if (distance > this.attackRange * 1.1) { // Too far, approach cautiously
                     this.x += moveXUnit * NPC_SPEED * 0.7;
                     this.y += moveYUnit * NPC_SPEED * 0.7;
                }
                // If in a good range (e.g., 0.5 to 1.1 of attackRange), might not move or could strafe (not implemented)
            }

            // Keep within canvas bounds
            this.x = Math.max(NPC_RADIUS, Math.min(CANVAS_WIDTH - NPC_RADIUS, this.x));
            this.y = Math.max(NPC_RADIUS, Math.min(CANVAS_HEIGHT - NPC_RADIUS, this.y));
        }

        attack() {
            if (!this.alive || !this.targetNpc || !this.targetNpc.alive) return;

            const distance = Math.sqrt((this.x - this.targetNpc.x)**2 + (this.y - this.targetNpc.y)**2);
            if (distance <= this.attackRange) {
                this.targetNpc.hp -= NPC_ATTACK_POWER;
                console.log(`${this.name} attacks ${this.targetNpc.name}, ${this.targetNpc.name} HP: ${this.targetNpc.hp}`);
                if (this.targetNpc.hp <= 0) {
                    this.targetNpc.hp = 0;
                    this.targetNpc.alive = false;
                    console.log(`${this.targetNpc.name} died.`);
                }
            }
        }

        update(allNpcs) {
            if (!this.alive) return;
            this.findTarget(allNpcs); // Always find target first
            if (this.targetNpc) {    // Then move and attack based on that target
                this.move();
                this.attack();
            }
        }

        draw(ctx) {
            if (!this.alive) return;

            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, NPC_RADIUS, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, this.x, this.y - NPC_RADIUS - 12); // Adjusted y for name
            ctx.fillText(`HP: ${this.hp}`, this.x, this.y - NPC_RADIUS - 2); // Adjusted y for HP
        }
    }

    // --- Game Logic ---
    function init() {
        console.log("Initializing game...");
        gameOver = false;
        npcs = [];
        for (let i = 0; i < NUM_NPCS; i++) {
            npcs.push(new NPC(i, `NPC ${i + 1}`));
        }
        console.log("NPCs created:", npcs.map(n => ({name: n.name, type: n.personalityType, range: n.rangeType, x:n.x, y:n.y, color:n.color})));

        resultDisplay.style.display = 'none';
        retryButton.style.display = 'none';

        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
        }
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function gameLoop() {
        if (gameOver) {
            return; // Stop the loop if game is over
        }

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const aliveNpcs = npcs.filter(npc => npc.alive);

        if (aliveNpcs.length <= 1) {
            gameOver = true;
            displayResult(aliveNpcs);
            cancelAnimationFrame(gameLoopId); // Explicitly stop the animation frame
            return;
        }

        // Update and draw NPCs
        aliveNpcs.forEach(npc => {
            npc.update(npcs); // Pass all npcs (including dead ones, findTarget will filter)
        });

        npcs.forEach(npc => {
            npc.draw(ctx); // Draw all (alive ones will draw themselves)
        });

        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function displayResult(aliveNpcs) {
        if (aliveNpcs.length === 1) {
            resultDisplay.textContent = `${aliveNpcs[0].name} WIN!`;
            console.log(`${aliveNpcs[0].name} WIN!`);
        } else {
            resultDisplay.textContent = '全滅…';
            console.log('全滅…');
        }
        resultDisplay.style.display = 'block';
        retryButton.style.display = 'block';
    }

    // --- Event Listeners ---
    retryButton.addEventListener('click', () => {
        console.log("Retry button clicked");
        init();
    });

    // --- Start Game ---
    init();
});
