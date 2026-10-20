import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { WebSocketServer, WebSocket } from 'ws';
import * as url from 'url';
import * as jwt from 'jsonwebtoken';
import { ChatService } from './chat.service';

@Injectable()
export class ChatGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatGateway.name);
  private wss: WebSocketServer | null = null;
  private readonly clients = new Map<string, Set<WebSocket>>();

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  onModuleInit() {
    this.chatService.registerWsNotifier((recipientId, event, payload) => {
      this.sendToUser(recipientId, event, payload);
    });

    const httpServer = this.httpAdapterHost?.httpAdapter?.getHttpServer?.();
    if (!httpServer) {
      this.logger.warn(
        'HTTP server not yet initialized; skipping WebSocket server attachment.',
      );
      return;
    }

    this.wss = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (request: any, socket: any, head: any) => {
      const pathname = url.parse(request.url).pathname;

      if (pathname === '/chat' || pathname === '/ws/chat') {
        const query = url.parse(request.url, true).query;
        const authHeader = request.headers['authorization'];
        let token = query.token as string;

        if (!token && authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }

        if (!token) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        try {
          const secret = this.configService.get<string>(
            'JWT_SECRET',
            'your-secret-key',
          );
          const decoded = jwt.verify(token, secret) as any;
          request.user = {
            id: decoded.sub,
            userId: decoded.sub,
            role: decoded.role,
            schoolId: decoded.schoolId,
            classIds: decoded.classIds || [],
          };

          this.wss!.handleUpgrade(request, socket, head, (ws: WebSocket) => {
            this.wss!.emit('connection', ws, request);
          });
        } catch (err: any) {
          this.logger.warn(`WebSocket authentication failed: ${err.message}`);
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
        }
      }
    });

    this.wss.on('connection', (ws: WebSocket, request: any) => {
      const user = request.user;
      if (!user || !user.id) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      const userId = user.id;
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)!.add(ws);
      this.logger.log(`WebSocket client connected: user=${userId}`);

      // Send initial connection acknowledgement
      ws.send(
        JSON.stringify({
          event: 'connected',
          data: { userId, message: 'Connected to Smart School Chat WebSocket' },
        }),
      );

      ws.on('message', async (data: any) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.action === 'send_message' && parsed.data) {
            const result = await this.chatService.sendMessage(user, parsed.data);
            ws.send(
              JSON.stringify({
                event: 'message_sent',
                data: result,
              }),
            );
          } else if (parsed.action === 'ping') {
            ws.send(JSON.stringify({ event: 'pong' }));
          }
        } catch (err: any) {
          ws.send(
            JSON.stringify({
              event: 'error',
              message: err.message || 'Error processing message',
            }),
          );
        }
      });

      ws.on('close', () => {
        const userSockets = this.clients.get(userId);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) {
            this.clients.delete(userId);
          }
        }
        this.logger.log(`WebSocket client disconnected: user=${userId}`);
      });

      ws.on('error', (err) => {
        this.logger.error(`WebSocket error on user=${userId}: ${err.message}`);
      });
    });

    this.logger.log('Chat WebSocket gateway initialized on /chat');
  }

  onModuleDestroy() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.clients.clear();
  }

  /**
   * Broadcast real-time message event to all open connections of a user
   */
  public sendToUser(userId: string, event: string, payload: any) {
    const userSockets = this.clients.get(userId);
    if (!userSockets || userSockets.size === 0) return;

    const data = JSON.stringify({ event, data: payload });
    for (const ws of userSockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }
}
