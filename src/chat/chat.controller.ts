import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { GetContactsDto } from './dto/get-contacts.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Chat & Messaging')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Get allowed chat contacts tailored to user role:
   * - Student: Admin + Her class teachers
   * - Teacher: Principal/Admin + Only her assigned classes students
   * - Admin: Anyone in this school (teachers, students, admins)
   */
  @Get('contacts')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get permitted chat contacts tailored to user role',
    description:
      'Student gets class teachers & admin. Teacher gets principal & assigned students. Admin gets anyone in the school.',
  })
  getContacts(
    @CurrentUser() user: any,
    @Query() dto: GetContactsDto,
  ) {
    return this.chatService.getContacts(user, dto);
  }

  /**
   * Get total unread messages count across all conversations.
   */
  @Get('unread-count')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Get total unread messages count across all conversations' })
  getUnreadCount(@CurrentUser() user: any) {
    return this.chatService.getUnreadCount(user);
  }

  /**
   * List all conversations for the authenticated user, sorted by lastMessageAt.
   */
  @Get('conversations')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'List user conversations with last message and unread count' })
  getUserConversations(@CurrentUser() user: any) {
    return this.chatService.getUserConversations(user);
  }

  /**
   * Start a new conversation or open an existing one with recipient.
   */
  @Post('conversations')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Start a conversation or send initial message to a permitted contact',
  })
  @ApiResponse({ status: 201, description: 'Conversation started successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden chat target based on role rules.' })
  startConversation(
    @Body() dto: StartConversationDto,
    @CurrentUser() user: any,
  ) {
    return this.chatService.startConversation(dto, user);
  }

  /**
   * Get messages in a conversation (paginated, auto-marks incoming messages as read).
   */
  @Get('conversations/:id/messages')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  getConversationMessages(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() dto: GetMessagesDto,
    @CurrentUser() user: any,
  ) {
    return this.chatService.getConversationMessages(id, user, dto);
  }

  /**
   * Send a message inside a specific conversation.
   */
  @Post('conversations/:id/messages')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  sendMessageInConversation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.chatService.sendMessage(user, {
      ...dto,
      conversationId: id,
    });
  }

  /**
   * Send a message directly by recipientId or conversationId.
   */
  @Post('messages')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Send a message directly' })
  sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.chatService.sendMessage(user, dto);
  }

  /**
   * Mark all unread messages in a conversation as read.
   */
  @Patch('conversations/:id/read')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Mark all unread messages in conversation as read' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  markAsRead(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.markAsRead(id, user.id);
  }
}
