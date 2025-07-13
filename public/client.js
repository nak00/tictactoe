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
            boardDisplay.classList.remove('game-over');
            statusDisplay.classList.remove('win-message'); // **NEW:** Remove special styling
            statusDisplay.textContent = `Player ${data.turn}'s Turn`;
            renderBoard(data.board);
            resetButton.style.display = 'none';
            break;
        case 'update':
            statusDisplay.textContent = `Player ${data.turn}'s Turn`;
            renderBoard(data.board);
            break;
        case 'win':
            statusDisplay.textContent = `Player ${data.winner} Wins!`;
            statusDisplay.classList.add('win-message'); // **NEW:** Add special styling for the win text
            boardDisplay.classList.add('game-over');
            resetButton.style.display = 'block';
            // **NEW:** Highlight the winning cells if the data is available
            if (data.winningLine) {
                highlightWinningCells(data.winningLine);
            }
            break;
        case 'draw':
            statusDisplay.textContent = "It's a Draw!";
            statusDisplay.classList.add('win-message'); // **NEW:** Also style the draw text
            boardDisplay.classList.add('game-over');
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
        if (cell) {
            cellElement.classList.add(cell);
        }
        cellElement.textContent = cell;
        cellElement.dataset.index = index;
        cellElement.addEventListener('click', handleCellClick);
        boardDisplay.appendChild(cellElement);
    });
}

// **NEW:** This function highlights the winning cells
function highlightWinningCells(winningLine) {
    winningLine.forEach(index => {
        const cell = boardDisplay.querySelector(`[data-index='${index}']`);
        if (cell) {
            cell.classList.add('winning-cell');
        }
    });
}

function handleCellClick(event) {
    if (boardDisplay.classList.contains('game-over')) {
        return;
    }
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
