let peerConnection;
let dataChannel;
let isHost = false;

// Функция для обновления статуса соединения в интерфейсе
function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.innerText = `Статус соединения: ${status}`;
}

// Конфигурация STUN и TURN серверов для WebRTC
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, // STUN сервер Google
        { urls: 'stun:stun1.l.google.com:19302' }, 
        { urls: 'stun:stun2.l.google.com:19302' }, 
        { urls: 'stun:stun3.l.google.com:19302' }, 
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' }, // STUN сервер Mozilla
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.l.google.com:5349" },
        { urls: "stun:stun1.l.google.com:3478" },
        { urls: "stun:stun1.l.google.com:5349" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:5349" },
        { urls: "stun:stun3.l.google.com:3478" },
        { urls: "stun:stun3.l.google.com:5349" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:5349" }
    ]
};

// Создаем WebRTC соединение
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // Логируем ICE-кандидатов и передаем их другой стороне через текстовые поля
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log('Новый ICE-кандидат:', event.candidate);
            document.getElementById('iceCandidates').value += JSON.stringify(event.candidate) + '\n';
        } else {
            console.log('Все ICE-кандидаты отправлены');
        }
    };

    // Логируем ошибки при передаче ICE-кандидатов
    peerConnection.onicecandidateerror = event => {
        console.error('Ошибка передачи ICE-кандидатов:', event);
    
        // Игнорируем определённые ошибки STUN-сервера
        if (event.errorCode === 701) { // Проблема с lookup STUN-сервера (STUN host lookup received error)
            console.log('STUN сервер недоступен, игнорируем ошибку...');
        }
    };

    // Слушаем изменения состояния соединения
    peerConnection.onconnectionstatechange = () => {
        const connectionState = peerConnection.connectionState;
        console.log(`Состояние соединения: ${connectionState}`);
        updateConnectionStatus(`Состояние соединения: ${connectionState}`);

        if (connectionState === 'connected') {
            console.log('Соединение успешно установлено');
            alert('Соединение успешно установлено!');
        }
    };

    // Обрабатываем создание канала данных
    peerConnection.ondatachannel = event => {
        console.log('Канал данных получен у гостя');
        dataChannel = event.channel;

        // Обработка открытия канала данных
        dataChannel.onopen = () => {
            console.log('Канал данных открыт (гость)');
            updateConnectionStatus('Канал данных открыт (гость)');
            alert('Канал данных открыт (гость), соединение установлено!');
        };

        // Обработка закрытия канала данных
        dataChannel.onclose = () => {
            console.log('Канал данных закрыт (гость)');
            updateConnectionStatus('Канал данных закрыт');
        };

        // Получаем сообщения от другого игрока
        dataChannel.onmessage = handleMessage;
    };

    return peerConnection;
}

// Обработка сообщений через канал данных
function handleMessage(event) {
    const data = JSON.parse(event.data);
    console.log('Полученные данные:', data);
}

// Создаем канал данных (для хоста)
function createDataChannel() {
    dataChannel = peerConnection.createDataChannel('gameData');
    console.log('Канал данных создан (хост)');

    // Обработка открытия канала данных
    dataChannel.onopen = () => {
        console.log('Канал данных открыт (хост)');
        updateConnectionStatus('Канал данных открыт (хост)');
        alert('Канал данных открыт (хост), соединение установлено!');
    };

    // Обработка закрытия канала данных
    dataChannel.onclose = () => {
        console.log('Канал данных закрыт (хост)');
        updateConnectionStatus('Канал данных закрыт');
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
    updateConnectionStatus('Ожидание ответа гостя...');
    console.log('Предложение (offer) создано:', offer);
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
        const offer = JSON.parse(offerText); // Проверяем, что содержимое поля - корректный JSON
        peerConnection = createPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        console.log('Предложение принято, создание ответа (answer)...');

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        document.getElementById('answer').value = JSON.stringify(answer);
        updateConnectionStatus('Ответ отправлен хосту, ожидание соединения...');
        console.log('Ответ (answer) отправлен:', answer);
    } catch (error) {
        console.error('Ошибка при обработке offer:', error);
        alert('Неверный формат offer. Убедитесь, что вы вставили правильное предложение.');
    }
};

// Хост: подтверждает ответ (answer)
document.getElementById('answer').oninput = async () => {
    const answerText = document.getElementById('answer').value.trim();

    if (!answerText) {
        alert('Поле "answer" не может быть пустым!');
        return;
    }

    try {
        const answer = JSON.parse(answerText); // Пробуем распарсить JSON
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer)); // Хост применяет answer
        console.log('Ответ принят и соединение установлено');
        alert('Ответ принят и соединение установлено');
        updateConnectionStatus('Соединение установлено');
    } catch (error) {
        console.error('Ошибка при обработке answer:', error);
        alert('Неверный формат answer. Убедитесь, что вы вставили правильный ответ.');
    }
};

// Обработка входящих ICE-кандидатов
document.getElementById('applyIceCandidates').onclick = () => {
    const candidates = document.getElementById('iceCandidates').value.split('\n');
    candidates.forEach(candidate => {
        if (candidate.trim() !== '') {
            try {
                peerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
                console.log('ICE-кандидат добавлен:', candidate);
            } catch (error) {
                console.error('Ошибка при добавлении ICE-кандидата:', error);
            }
        }
    });
};
