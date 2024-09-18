let peerConnection;
let dataChannel; // Глобальная переменная для dataChannel

// Конфигурация STUN сервера для WebRTC
const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Используем публичный STUN сервер Google
};

// Создаем WebRTC соединение
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // ICE кандидаты
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log('Новый ICE-кандидат:', event.candidate);
        }
    };

    // Получаем данные от другого игрока
    peerConnection.ondatachannel = event => {
        const receiveChannel = event.channel;
        receiveChannel.onmessage = handleMessage;
    };

    return peerConnection;
}

// Обработка сообщений
function handleMessage(event) {
    const data = JSON.parse(event.data);
    console.log('Полученные данные:', data);
    // Здесь можно добавить вызов функции для обновления состояния игры в game.js
}

// Создаем канал данных для передачи сообщений между игроками
function createDataChannel() {
    dataChannel = peerConnection.createDataChannel('gameData');

    dataChannel.onopen = () => {
        console.log('Data channel открыт');
    };

    dataChannel.onmessage = handleMessage;

    return dataChannel;
}

// Хост: запускает сессию
document.getElementById('startButton').onclick = async () => {
    peerConnection = createPeerConnection();
    createDataChannel();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    document.getElementById('offer').value = JSON.stringify(offer);
};

// Гость: присоединяется к сессии
document.getElementById('joinButton').onclick = async () => {
    peerConnection = createPeerConnection();

    const offer = JSON.parse(document.getElementById('offer').value);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    document.getElementById('answer').value = JSON.stringify(answer);
};

// Установить ответ хоста
document.getElementById('answer').oninput = async () => {
    const answer = JSON.parse(document.getElementById('answer').value);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
};
