import { Logger } from '@nestjs/common';
import { BaseGateway } from '@/common/core/base-gateway';
import { IAuthUser } from '@/common/request/interfaces';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JoinRoomDto, LeaveRoomDto, RoomDto, SendMessageDto } from '../dtos';

enum MessageType {
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  MESSAGE = 'message',
  SYSTEM = 'system',
}

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway extends BaseGateway {
  private getUserRoom(room: string) {
    return `room:${room}`;
  }

  constructor() {
    super();
  }

  handleConnection(client: Socket): void {
    super.handleConnection(client);
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    super.handleDisconnect(client);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  async getData(client: Socket, dto: RoomDto) {
    const user = client.data.user as IAuthUser;
    const room = this.getUserRoom(dto.room);

    return { user, room };
  }

  @SubscribeMessage('chat:join-room')
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    const { user, room } = await this.getData(client, dto);

    await client.join(room);

    this.logger.log(`User ${user.userId} joined room ${room}`);

    client.to(room).emit(MessageType.SYSTEM, {
      type: MessageType.JOIN_ROOM,
      payload: {
        userId: user.userId,
        room: dto.room,
      },
    });
  }

  @SubscribeMessage('chat:send-message')
  async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const { user, room } = await this.getData(client, dto);

    this.logger.log(`Message from ${user.userId} to ${room}: ${dto.content}`);

    client.to(room).emit(MessageType.MESSAGE, {
      type: MessageType.MESSAGE,
      payload: {
        userId: user.userId,
        room: dto.room,
        content: dto.content,
      },
    });
  }

  @SubscribeMessage('chat:leave-room')
  async onLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: LeaveRoomDto,
  ) {
    const { user, room } = await this.getData(client, dto);

    await client.leave(room);

    this.logger.log(`User ${user.userId} left room ${room}`);

    client.to(room).emit(MessageType.SYSTEM, {
      type: MessageType.LEAVE_ROOM,
      payload: {
        userId: user.userId,
        room: dto.room,
      },
    });
  }
}
