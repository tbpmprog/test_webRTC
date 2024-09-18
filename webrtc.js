let peerConnection;
const startButton = document.getElementById('startButton');
const joinButton = document.getElementById('joinButton');
const offerTextarea = document.getElementById('offer');
const answerTextarea = document.getElementById('answer');

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
    // Здесь будет обработка движения танков, выстрелов и состояния игры
}

// Создаем канал данных для передачи сообщений между игроками
function createDataChannel() {
    const dataChannel = peerConnection.createDataChannel('gameData');

    dataChannel.onopen = () => {
        console.log('Data channel открыт');
    };

    dataChannel.onmessage = handleMessage;

    return dataChannel;
}

// Хост: запускает сессию
startButton.onclick = async () => {
    peerConnection = createPeerConnection();
    const dataChannel = createDataChannel();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    offerTextarea.value = JSON.stringify(offer);
};

// Гость: присоединяется к сессии
joinButton.onclick = async () => {
    peerConnection = createPeerConnection();

    const offer = JSON.parse(offerTextarea.value);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    answerTextarea.value = JSON.stringify(answer);
};

// Установить ответ хоста
answerTextarea.oninput = async () => {
    const answer = JSON.parse(answerTextarea.value);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
};
