import { Inject, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { HelperEncryptionService } from '../helper/services/helper.encryption.service';
export abstract class BaseGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  protected readonly logger = new Logger(this.constructor.name);
  @Inject(HelperEncryptionService)
  protected readonly jwt: HelperEncryptionService;

  afterInit(server: Server) {
    server.use(async (socket, next) => {
      try {
        const authHeader = socket.handshake.headers?.authorization;
        if (!authHeader) {
          return next(new Error('Unauthorized'));
        }

        const token = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7).trim()
          : authHeader.trim();

        if (!token) {
          return next(new Error('Unauthorized'));
        }

        socket.data.user = await this.jwt.verifyToken(token);
        next();
      } catch (err) {
        this.logger.error(`Unauthorized: ${err.message}`);
        next(new Error('Unauthorized'));
      }
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Disconnected: ${client.id}`);
  }
}
