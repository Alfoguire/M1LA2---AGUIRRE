class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x87ceeb);

        this.add.text(400, 200, 'KNIGHT QUEST', {
            fontFamily: 'Courier New',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const startBtn = this.add.text(400, 300, 'START GAME', {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.colors = [0xff0000, 0xffa500, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0xee82ee];
        this.colorIndex = 0;
    }

    preload() {
        this.load.spritesheet('knight', 'assets/spritesheets/knight.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet('coin', 'assets/spritesheets/coin.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        this.load.image('bomb', 'assets/images/bomb.png');

        this.load.audio('coinSound', 'assets/sounds/coin.wav');
        this.load.audio('explosion', 'assets/sounds/explosion.wav');
        this.load.audio('bgMusic', 'assets/sounds/time_for_adventure.mp3');
    }

    create() {
        this.starsCollected = 0;

        this.add.rectangle(400, 300, 800, 600, 0x87ceeb);

        this.platforms = this.physics.add.staticGroup();
        this.createPlatform(400, 590, 800); 
        this.createPlatform(700, 375, 120);
        this.createPlatform(400, 450, 120);
        this.createPlatform(175, 500, 100);
        this.createPlatform(600, 500, 100);
        this.createPlatform(50, 400, 100);

        this.player = this.physics.add.sprite(100, 450, 'knight').setScale(2).setCollideWorldBounds(true);
        this.player.body.setSize(20, 30).setOffset(6, 2);

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('knight', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('knight', { start: 4, end: 19 }),
            frameRate: 12,
            repeat: -1
        });

        this.player.play('idle');

        this.coin = this.physics.add.sprite(400, 0, 'coin').setScale(2);
        this.coin.setBounce(0);
        this.coin.setCollideWorldBounds(true);
        this.coin.body.setSize(16, 16).setOffset(0, 0);

        this.anims.create({
            key: 'spin',
            frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 11 }),
            frameRate: 12,
            repeat: -1
        });

        this.coin.play('spin');

        this.bombs = this.physics.add.group();

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.coin, this.platforms);

        this.physics.add.overlap(this.player, this.coin, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.bombs, this.hitBomb, null, this);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.coinSound = this.sound.add('coinSound');
        this.explosionSound = this.sound.add('explosion');
        this.bgMusic = this.sound.add('bgMusic', {
            volume: 0.5,
            loop: true
        });
        this.bgMusic.play();

        this.starText = this.add.text(600, 16, 'Stars Collected: 0', {
            fontFamily: 'Courier New',
            fontSize: '12px',
            color: '#ffffff'
        });

        this.time.addEvent({
            delay: Phaser.Math.Between(2000, 4000),
            callback: this.spawnBomb,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.setFlipX(true);
            this.player.play('run', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.setFlipX(false);
            this.player.play('run', true);
        } else {
            this.player.setVelocityX(0);
            this.player.play('idle', true);
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
    }

    collectCoin(player, coin) {
        this.coinSound.play();

        coin.disableBody(true, true);
        this.starsCollected++;
        this.starText.setText('Stars Collected: ' + this.starsCollected);

        this.colorIndex = (this.colorIndex + 1) % this.colors.length;
        this.player.setTint(this.colors[this.colorIndex]);

        if (this.starsCollected % 5 === 0) {
            this.player.setScale(this.player.scale + 0.1);
        }

        this.spawnNewCoin();
    }

    spawnNewCoin() {
        const x = Phaser.Math.Between(50, 750);
        const y = Phaser.Math.Between(0, 50);

        this.coin.enableBody(true, x, y, true, true);
        this.coin.setVelocity(0, 0);
        this.coin.setBounce(0);
        this.coin.setCollideWorldBounds(true);
        this.coin.play('spin');
    }

    createPlatform(x, y, width) {
        const platform = this.add.rectangle(x, y, width, 20, 0x228B22);
        this.physics.add.existing(platform, true);
        platform.body.setSize(width, 20);
        this.platforms.add(platform);
    }

    spawnBomb() {
        const x = Phaser.Math.Between(50, 750);
        const bomb = this.bombs.create(x, 0, 'bomb');
        bomb.setVelocity(0, 250);
        bomb.body.setAllowGravity(true);

        bomb.setScale(0.1);
        bomb.body.checkCollision.up = false;
        bomb.body.checkCollision.down = false;
        bomb.body.checkCollision.left = false;
        bomb.body.checkCollision.right = false;
        bomb.body.setSize(bomb.width * 0.1, bomb.height * 0.1, true);

        this.time.delayedCall(8000, () => {
            if (bomb.active) bomb.destroy();
        });
    }

    hitBomb(player, bomb) {
        this.bgMusic.stop();
        this.explosionSound.play();
        bomb.destroy();
        this.player.setVisible(false);
        this.player.body.enable = false;
        this.scene.start('GameOverScene');
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x000000);

        this.add.text(400, 200, 'GAME OVER', {
            fontFamily: 'Courier New',
            fontSize: '24px',
            color: '#ff0000'
        }).setOrigin(0.5);

        const retry = this.add.text(400, 300, 'RETRY', {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        const menu = this.add.text(400, 360, 'RETURN TO MENU', {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        retry.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        menu.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#87ceeb',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
