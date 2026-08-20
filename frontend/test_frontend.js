function parseSSEBlock(block) {
    const lines = block.split('\n');
    let eventType = 'message';
    let dataStr = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith(':')) {
            if (trimmed.includes('heartbeat')) {
                return { eventType: 'heartbeat', data: 'keep-alive' };
            }
            continue;
        }
        if (trimmed.startsWith('event:')) {
            eventType = trimmed.substring(6).trim();
        } else if (trimmed.startsWith('data:')) {
            dataStr += trimmed.substring(5).trim();
        }
    }

    if (!eventType && !dataStr) return null;

    try {
        const data = dataStr ? JSON.parse(dataStr) : null;
        return { eventType, data };
    } catch {
        return { eventType, data: dataStr };
    }
}

const block = 'id: 1\nevent: token\ndata: "We"';
console.log(parseSSEBlock(block));
