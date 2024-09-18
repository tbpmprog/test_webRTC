let peerConnection;
let dataChannel;
let isHost = false; // Теперь isHost объявляется здесь

// Конфигурация STUN сервера для WebRTC
const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Используем публичный STUN сервер Google
};

// Создаем WebRTC соединение
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // Слушаем изменения состояния соединения
    peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
            console.log('Соединение успешно установлено');
            alert('Соединение успешно установлено!');
        }
    };

    // ICE кандидаты
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log('Новый ICE-кандидат:', event.candidate);
        }
    };

    // Получаем канал данных от другого игрока
    peerConnection.ondatachannel = event => {
        dataChannel = event.channel;

        // Сообщаем, что канал данных открыт
        dataChannel.onopen = () => {
            console.log('Канал данных открыт!');
            alert('Канал данных открыт, соединение установлено!');
        };

        // Сообщаем, что канал данных закрыт
        dataChannel.onclose = () => {
            console.log('Канал данных закрыт');
            alert('Канал данных закрыт!');
        };

        // Получаем сообщения от другого игрока
        dataChannel.onmessage = handleMessage;
    };

    return peerConnection;
}

// Обработка сообщений
function handleMessage(event) {
    const data = JSON.parse(event.data);
    console.log('Полученные данные:', data);
}

// Создаем канал данных для передачи сообщений между игроками
function createDataChannel() {
    dataChannel = peerConnection.createDataChannel('gameData');

    // Сообщаем, что канал данных открыт
    dataChannel.onopen = () => {
        console.log('Канал данных открыт!');
        alert('Канал данных открыт, соединение установлено!');
    };

    // Сообщаем, что канал данных закрыт
    dataChannel.onclose = () => {
        console.log('Канал данных закрыт');
        alert('Канал данных закрыт!');
    };

    dataChannel.onmessage = handleMessage;

    return dataChannel;
}

// Хост: запускает сессию
document.getElementById('startButton').onclick = async () => {
    isHost = true; // Хост задается здесь
    peerConnection = createPeerConnection();
    createDataChannel();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    document.getElementById('offer').value = JSON.stringify(offer);
};

// Гость: присоединяется к сессии
document.getElementById('joinButton').onclick = async () => {
    isHost = false; // Устанавливаем, что этот игрок — не хост
    const offerText = document.getElementById('offer').value.trim();

    if (!offerText) {
        alert('Поле "offer" не может быть пустым!');
        return;
    }

    try {
        const offer = JSON.parse(offerText);
        peerConnection = createPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        document.getElementById('answer').value = JSON.stringify(answer);
    } catch (error) {
        console.error('Ошибка при парсинге offer:', error);
        alert('Неверный формат offer. Убедитесь, что вы вставили правильное предложение.');
    }
};

// Установить ответ хоста
document.getElementById('answer').oninput = async () => {
    const answerText = document.getElementById('answer').value.trim();

    if (!answerText) {
        alert('Поле "answer" не может быть пустым!');
        return;
    }

    try {
        const answer = JSON.parse(answerText);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
        console.error('Ошибка при парсинге answer:', error);
        alert('Неверный формат answer. Убедитесь, что вы вставили правильный ответ.');
    }
};
