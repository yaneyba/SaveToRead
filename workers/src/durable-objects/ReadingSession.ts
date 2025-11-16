/**
 * ReadingSession Durable Object
 *
 * Manages real-time reading sessions and synchronization
 */

export class ReadingSession {
  
  private sessions: Map<string, WebSocket> = new Map();

  constructor(_state: DurableObjectState) {
    // State not used in this simple implementation
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      const userId = url.searchParams.get('userId');
      const articleId = url.searchParams.get('articleId');

      if (!userId || !articleId) {
        return new Response('Missing userId or articleId', { status: 400 });
      }

      const sessionId = `${userId}:${articleId}`;
      this.sessions.set(sessionId, server);

      server.accept();

      server.addEventListener('message', (event) => {
        // Broadcast reading progress to other sessions
        const data = JSON.parse(event.data as string);
        this.broadcast(sessionId, data);
      });

      server.addEventListener('close', () => {
        this.sessions.delete(sessionId);
      });

      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    return new Response('Expected WebSocket', { status: 400 });
  }

  private broadcast(excludeSessionId: string, data: any) {
    for (const [sessionId, ws] of this.sessions) {
      if (sessionId !== excludeSessionId) {
        try {
          ws.send(JSON.stringify(data));
        } catch (err) {
          // Connection closed, remove it
          this.sessions.delete(sessionId);
        }
      }
    }
  }
}
