const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Размеры танка
const TANK_WIDTH = 40;
const TANK_HEIGHT = 40;

// Параметры снаряда
const BULLET_SPEED = 5;
const BULLET_RADIUS = 5;
const RELOAD_TIME = 500; // Время перезарядки в миллисекундах

// Массив для хранения снарядов и танков
let bullets = [];
let tanks = []; // Массив танков
let lastShotTime = 0; // Время последнего выстрела

let isHost = false;

// Управление с клавиатуры
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyV: false, // Клавиша для выстрела "V"
};

// Создание танка
function createTank(x, y, angle = 0) {
    return {
        x: x,
        y: y,
        angle: angle,
        speed: 2,
        rotationSpeed: 3,
        health: 100, // Добавляем здоровье танку
        isDestroyed: false // Флаг для проверки, уничтожен ли танк
    };
}

// Инициализация танков
tanks.push(createTank(canvas.width / 2 - TANK_WIDTH / 2, canvas.height / 2 - TANK_HEIGHT / 2)); // Игрок
tanks.push(createTank(100, 100)); // Противник для синхронизации с другим игроком

// Слушатели событий для клавиш
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyV') {
        keys.KeyV = true;
    } else if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyV') {
        keys.KeyV = false;
    } else if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

// Основная функция отрисовки танка
function drawTank(tank) {
    if (tank.isDestroyed) return;

    ctx.save();
    ctx.translate(tank.x + TANK_WIDTH / 2, tank.y + TANK_HEIGHT / 2);
    ctx.rotate(tank.angle * Math.PI / 180);
    ctx.fillStyle = 'green';
    ctx.fillRect(-TANK_WIDTH / 2, -TANK_HEIGHT / 2, TANK_WIDTH, TANK_HEIGHT);
    ctx.restore();
}

// Функция для стрельбы
function shootBullet(tankIndex) {
    const tank = tanks[tankIndex];
    const currentTime = Date.now();

    if (currentTime - lastShotTime >= RELOAD_TIME) {
        const bulletX = tank.x + (Math.cos(tank.angle * Math.PI / 180) * TANK_WIDTH / 2) + TANK_WIDTH / 2;
        const bulletY = tank.y + (Math.sin(tank.angle * Math.PI / 180) * TANK_HEIGHT / 2) + TANK_HEIGHT / 2;

        const bullet = {
            x: bulletX,
            y: bulletY,
            angle: tank.angle,
            speed: BULLET_SPEED,
            shooterId: tankIndex // Идентификатор стреляющего танка
        };

        bullets.push(bullet);
        lastShotTime = currentTime; // Обновляем время последнего выстрела
    }
}

// Обновление положения танка игрока
function updatePlayerTank() {
    const playerTank = tanks[0];

    if (keys.ArrowLeft) playerTank.angle -= playerTank.rotationSpeed;
    if (keys.ArrowRight) playerTank.angle += playerTank.rotationSpeed;

    if (keys.ArrowUp) {
        const nextX = playerTank.x + Math.cos(playerTank.angle * Math.PI / 180) * playerTank.speed;
        const nextY = playerTank.y + Math.sin(playerTank.angle * Math.PI / 180) * playerTank.speed;

        playerTank.x = nextX;
        playerTank.y = nextY;
    }

    if (keys.ArrowDown) {
        const nextX = playerTank.x - Math.cos(playerTank.angle * Math.PI / 180) * playerTank.speed;
        const nextY = playerTank.y - Math.sin(playerTank.angle * Math.PI / 180) * playerTank.speed;

        playerTank.x = nextX;
        playerTank.y = nextY;
    }
}

// Обновление положения снарядов
function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.x += Math.cos(bullet.angle * Math.PI / 180) * bullet.speed;
        bullet.y += Math.sin(bullet.angle * Math.PI / 180) * bullet.speed;

        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(index, 1);
        }
    });
}

// Отрисовка снарядов
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();
    });
}

// Отправка состояния игры
function sendGameState() {
    // Проверяем, инициализирован ли dataChannel и открыт ли канал
    if (typeof dataChannel !== 'undefined' && dataChannel.readyState === 'open') {
        const gameState = {
            tank: {
                x: tanks[0].x,
                y: tanks[0].y,
                angle: tanks[0].angle,
                health: tanks[0].health
            },
            bullets
        };

        dataChannel.send(JSON.stringify(gameState));
    }
}

// Получаем данные от другого игрока и обновляем состояние
function handleMessage(event) {
    const data = JSON.parse(event.data);

    if (!isHost) {
        tanks[1].x = data.tank.x;
        tanks[1].y = data.tank.y;
        tanks[1].angle = data.tank.angle;
        tanks[1].health = data.tank.health;

        bullets = data.bullets; // Синхронизируем выстрелы
    }
}

// Основной игровой цикл
function gameLoop() {
    updatePlayerTank();

    if (keys.KeyV) {
        shootBullet(0); // Стреляет игрок
    }

    updateBullets();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tanks.forEach(tank => drawTank(tank));
    drawBullets();

    sendGameState(); // Передача состояния игры другому игроку

    requestAnimationFrame(gameLoop);
}

// Запуск игры
gameLoop();
