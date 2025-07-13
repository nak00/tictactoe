const statusDisplay = document.getElementById('status');
const boardDisplay = document.getElementById('game-board');
const playerIdDisplay = document.getElementById('player-id');
const resetButton = document.getElementById('reset-button');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');

// Determine WebSocket protocol
const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const ws = new WebSocket(`${protocol}://${window.location.host}`);

let myPlayerId = null;

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
        case 'player-assign':
            myPlayerId = data.player;
            playerIdDisplay.textContent = `You are Player ${myPlayerId}`;
            break;
        case 'game-start':
        case 'update':
            statusDisplay.textContent = `Player ${data.turn}'s Turn`;
            renderBoard(data.board);
            resetButton.style.display = 'none';
            break;
        case 'win':
            statusDisplay.textContent = `Player ${data.winner} Wins!`;
            resetButton.style.display = 'block';
            break;
        case 'draw':
            statusDisplay.textContent = "It's a Draw!";
            resetButton.style.display = 'block';
            break;
        case 'chat':
            const messageElement = document.createElement('p');
            messageElement.textContent = `Player ${data.player}: ${data.message}`;
            chatBox.appendChild(messageElement);
            chatBox.scrollTop = chatBox.scrollHeight;
            break;
        case 'player-left':
            statusDisplay.textContent = data.message;
            renderBoard(['', '', '', '', '', '', '', '', '']); // Clear board
            break;
        case 'error':
            alert(data.message);
            statusDisplay.textContent = data.message;
            break;
    }
};

function renderBoard(board) {
    boardDisplay.innerHTML = '';
    board.forEach((cell, index) => {
        const cellElement = document.createElement('div');
        cellElement.classList.add('cell');
        cellElement.textContent = cell;
        cellElement.dataset.index = index;
        cellElement.addEventListener('click', handleCellClick);
        boardDisplay.appendChild(cellElement);
    });
}

function handleCellClick(event) {
    const index = event.target.dataset.index;
    ws.send(JSON.stringify({ type: 'move', index: parseInt(index) }));
}

resetButton.addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'reset' }));
});

sendButton.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
});

function sendChatMessage() {
    const message = chatInput.value;
    if (message.trim()) {
        ws.send(JSON.stringify({ type: 'chat', message: message }));
        chatInput.value = '';
    }
}
