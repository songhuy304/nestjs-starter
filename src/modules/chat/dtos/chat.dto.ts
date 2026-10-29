import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RoomDto {
  @IsString()
  @IsNotEmpty()
  room: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}

export class LeaveRoomDto extends RoomDto {}
export class JoinRoomDto extends RoomDto {}
