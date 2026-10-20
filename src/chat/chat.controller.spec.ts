import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { UserRole } from '../users/entities/user.entity';

describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;

  const mockUser = {
    id: 'user-uuid',
    userId: 'user-uuid',
    role: UserRole.STUDENT,
    schoolId: 'school-uuid',
  };

  const mockService = {
    getContacts: jest.fn().mockResolvedValue({ admins: [], classTeachers: [] }),
    getUnreadCount: jest.fn().mockResolvedValue({ unreadCount: 0 }),
    getUserConversations: jest.fn().mockResolvedValue([]),
    startConversation: jest.fn().mockResolvedValue({ conversation: {}, message: null }),
    getConversationMessages: jest.fn().mockResolvedValue({ messages: [], total: 0 }),
    sendMessage: jest.fn().mockResolvedValue({ id: 'msg-1' }),
    markAsRead: jest.fn().mockResolvedValue({ success: true, markedCount: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.getContacts', async () => {
    await controller.getContacts(mockUser, { search: 'John' });
    expect(service.getContacts).toHaveBeenCalledWith(mockUser, { search: 'John' });
  });

  it('should call service.getUnreadCount', async () => {
    await controller.getUnreadCount(mockUser);
    expect(service.getUnreadCount).toHaveBeenCalledWith(mockUser);
  });

  it('should call service.getUserConversations', async () => {
    await controller.getUserConversations(mockUser);
    expect(service.getUserConversations).toHaveBeenCalledWith(mockUser);
  });

  it('should call service.startConversation', async () => {
    const dto = { recipientId: '11111111-2222-3333-4444-555555555555', message: 'Hello' };
    await controller.startConversation(dto, mockUser);
    expect(service.startConversation).toHaveBeenCalledWith(dto, mockUser);
  });

  it('should call service.getConversationMessages', async () => {
    const convId = '11111111-2222-3333-4444-555555555555';
    await controller.getConversationMessages(convId, { page: 1, limit: 20 }, mockUser);
    expect(service.getConversationMessages).toHaveBeenCalledWith(
      convId,
      mockUser,
      { page: 1, limit: 20 },
    );
  });

  it('should call service.sendMessageInConversation', async () => {
    const convId = '11111111-2222-3333-4444-555555555555';
    const dto = { message: 'In conversation message' };
    await controller.sendMessageInConversation(convId, dto, mockUser);
    expect(service.sendMessage).toHaveBeenCalledWith(mockUser, {
      ...dto,
      conversationId: convId,
    });
  });

  it('should call service.sendMessage', async () => {
    const dto = { recipientId: '22222222-3333-4444-5555-666666666666', message: 'Direct message' };
    await controller.sendMessage(dto, mockUser);
    expect(service.sendMessage).toHaveBeenCalledWith(mockUser, dto);
  });

  it('should call service.markAsRead', async () => {
    const convId = '11111111-2222-3333-4444-555555555555';
    await controller.markAsRead(convId, mockUser);
    expect(service.markAsRead).toHaveBeenCalledWith(convId, mockUser.id);
  });
});
