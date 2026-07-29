/**
 * Automated Test Suite for FAM Music V.2
 * Tests all Phase 4 features with mock data
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// Test Configuration
const WS_URL = 'ws://localhost:8080';
const JWT_SECRET = 'your-secret-key-change-in-production'; // Match server secret

// Generate valid test tokens
function generateToken(userId) {
    return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '1h' });
}

const MOCK_TOKEN = generateToken('test-user-1');

// Test Results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
        'info': '📝',
        'success': '✅',
        'error': '❌',
        'test': '🧪'
    }[type] || '📝';

    console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordTest(name, passed, details = '') {
    results.tests.push({ name, passed, details });
    if (passed) {
        results.passed++;
        log(`PASS: ${name}`, 'success');
    } else {
        results.failed++;
        log(`FAIL: ${name} - ${details}`, 'error');
    }
}

// Test 1: WebSocket Connection
async function testWebSocketConnection() {
    return new Promise((resolve) => {
        log('Testing WebSocket connection...', 'test');

        const ws = new WebSocket(`${WS_URL}?token=${MOCK_TOKEN}`);

        const timeout = setTimeout(() => {
            recordTest('WebSocket Connection', false, 'Connection timeout');
            ws.close();
            resolve();
        }, 5000);

        ws.on('open', () => {
            clearTimeout(timeout);
            recordTest('WebSocket Connection', true);
            ws.close();
            resolve();
        });

        ws.on('error', (err) => {
            clearTimeout(timeout);
            recordTest('WebSocket Connection', false, err.message);
            resolve();
        });
    });
}

// Test 2: Heartbeat/Ping-Pong
async function testHeartbeat() {
    return new Promise((resolve) => {
        log('Testing heartbeat mechanism...', 'test');

        const ws = new WebSocket(`${WS_URL}?token=${MOCK_TOKEN}`);
        let pongReceived = false;

        ws.on('open', () => {
            ws.send(JSON.stringify({ type: 'ping' }));
        });

        ws.on('message', (data) => {
            const message = JSON.parse(data);
            if (message.type === 'pong') {
                pongReceived = true;
                recordTest('Heartbeat Ping-Pong', true);
                ws.close();
                resolve();
            }
        });

        setTimeout(() => {
            if (!pongReceived) {
                recordTest('Heartbeat Ping-Pong', false, 'No pong received');
                ws.close();
            }
            resolve();
        }, 3000);
    });
}

// Test 3: Radio Station Join
async function testRadioJoin() {
    return new Promise((resolve) => {
        log('Testing radio station join...', 'test');

        const ws = new WebSocket(`${WS_URL}?token=${MOCK_TOKEN}`);
        let joinConfirmed = false;

        ws.on('open', () => {
            ws.send(JSON.stringify({
                type: 'radio:join',
                stationId: 'test-station-1'
            }));
        });

        ws.on('message', (data) => {
            const message = JSON.parse(data);
            if (message.type === 'radio:listener-joined') {
                joinConfirmed = true;
                recordTest('Radio Station Join', true);
                ws.close();
                resolve();
            }
        });

        setTimeout(() => {
            if (!joinConfirmed) {
                recordTest('Radio Station Join', false, 'No join confirmation');
                ws.close();
            }
            resolve();
        }, 3000);
    });
    resolve();
}, 4000);
    });
}

// Test 6: Song Request
async function testSongRequest() {
    return new Promise((resolve) => {
        log('Testing song request...', 'test');

        const ws = new WebSocket(`${WS_URL}?token=${MOCK_TOKEN}`);
        let requestReceived = false;
        const stationId = 'test-station-request';

        ws.on('open', () => {
            ws.send(JSON.stringify({ type: 'radio:join', stationId }));

            setTimeout(() => {
                ws.send(JSON.stringify({
                    type: 'radio:song-request',
                    stationId,
                    track: {
                        id: 'test-track-123',
                        name: 'Test Song',
                        artist: 'Test Artist'
                    }
                }));
            }, 500);
        });

        ws.on('message', (data) => {
            const message = JSON.parse(data);
            if (message.type === 'radio:song-request' && message.track.name === 'Test Song') {
                requestReceived = true;
                recordTest('Song Request', true);
                ws.close();
                resolve();
            }
        });

        setTimeout(() => {
            if (!requestReceived) {
                recordTest('Song Request', false, 'Request not broadcast');
                ws.close();
            }
            resolve();
        }, 3000);
    });
    resolve();
}, 4000);
    });
}

// Run all tests
async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 FAM MUSIC V.2 - AUTOMATED TEST SUITE');
    console.log('='.repeat(60) + '\n');

    log('Starting automated tests...', 'info');
    log(`WebSocket Server: ${WS_URL}`, 'info');
    log('', 'info');

    // Run tests sequentially
    await testWebSocketConnection();
    await new Promise(r => setTimeout(r, 500));

    await testHeartbeat();
    await new Promise(r => setTimeout(r, 500));

    await testRadioJoin();
    await new Promise(r => setTimeout(r, 500));

    await testChatBroadcast();
    await new Promise(r => setTimeout(r, 500));

    await testReactionBroadcast();
    await new Promise(r => setTimeout(r, 500));

    await testSongRequest();
    await new Promise(r => setTimeout(r, 500));

    await testConcurrentConnections();
    await new Promise(r => setTimeout(r, 500));

    await testListenerCount();

    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60) + '\n');

    // Detailed results
    if (results.failed > 0) {
        console.log('Failed Tests:');
        results.tests.filter(t => !t.passed).forEach(t => {
            console.log(`  ❌ ${t.name}: ${t.details}`);
        });
        console.log('');
    }

    process.exit(results.failed > 0 ? 1 : 0);
}

// Start tests
runAllTests().catch(err => {
    console.error('Test suite error:', err);
    process.exit(1);
});
