const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from a 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

let players = {};
let gameBoard = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;

wss.on('connection', (ws) => {
    let playerId;

    // Assign player 'X' or 'O'
    if (Object.keys(players).length === 0) {
        playerId = 'X';
    } else if (Object.keys(players).length === 1) {
        playerId = 'O';
    } else {
        // Spectator logic (optional) or reject connection
        ws.send(JSON.stringify({ type: 'error', message: 'Game is full.' }));
        ws.close();
        return;
    }

    players[playerId] = ws;
    ws.send(JSON.stringify({ type: 'player-assign', player: playerId }));

    // If two players are connected, start the game
    if (Object.keys(players).length === 2) {
        broadcast({ type: 'game-start', board: gameBoard, turn: currentPlayer });
    }

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'move' && gameActive && playerId === currentPlayer) {
            const { index } = data;
            if (gameBoard[index] === '') {
                gameBoard[index] = currentPlayer;
                checkWin();
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                broadcast({ type: 'update', board: gameBoard, turn: currentPlayer });
            }
        } else if (data.type === 'chat') {
            broadcast({ type: 'chat', player: playerId, message: data.message });
        } else if (data.type === 'reset') {
            resetGame();
            broadcast({ type: 'game-start', board: gameBoard, turn: currentPlayer });
        }
    });

    ws.on('close', () => {
        delete players[playerId];
        // If a player leaves, reset the game
        resetGame();
        broadcast({ type: 'player-left', message: `Player ${playerId} has left. Game reset.` });
    });
});

function broadcast(data) {
    const message = JSON.stringify(data);
    for (const player in players) {
        players[player].send(message);
    }
}

// Find this function in server.js and replace it
function checkWin() {
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (let condition of winConditions) {
        const [a, b, c] = condition;
        if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
            gameActive = false;
            // **CHANGE:** We now include the 'winningLine' in the message
            broadcast({ type: 'win', winner: gameBoard[a], winningLine: condition });
            return;
        }
    }

    if (!gameBoard.includes('')) {
        gameActive = false;
        broadcast({ type: 'draw' });
    }
}

function resetGame() {
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
