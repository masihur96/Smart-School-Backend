import { Test, TestingModule } from '@nestjs/testing';
import { RequestComplaintsController } from './request-complaints.controller';
import { RequestComplaintsService } from './request-complaints.service';
import {
  RequestComplaintType,
  RequestComplaintStatus,
} from './entities/request-complaint.entity';
import { UserRole } from '../users/entities/user.entity';

describe('RequestComplaintsController', () => {
  let controller: RequestComplaintsController;
  let service: RequestComplaintsService;

  const mockUser = {
    id: 'user-uuid',
    userId: 'user-uuid',
    role: UserRole.STUDENT,
    schoolId: 'school-uuid',
  };

  const mockService = {
    create: jest.fn().mockResolvedValue({ id: 'rc-1' }),
    getAvailableRecipients: jest.fn().mockResolvedValue({ admins: [], classTeachers: [] }),
    getStats: jest.fn().mockResolvedValue({ total: 1 }),
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findOne: jest.fn().mockResolvedValue({ id: 'rc-1' }),
    updateStatus: jest.fn().mockResolvedValue({ id: 'rc-1', status: RequestComplaintStatus.RESOLVED }),
    addComment: jest.fn().mockResolvedValue({ id: 'comment-1' }),
    remove: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestComplaintsController],
      providers: [
        {
          provide: RequestComplaintsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<RequestComplaintsController>(
      RequestComplaintsController,
    );
    service = module.get<RequestComplaintsService>(RequestComplaintsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create', async () => {
    const dto = {
      type: RequestComplaintType.REQUEST,
      title: 'Title',
      description: 'Description',
    };
    await controller.create(dto as any, mockUser);
    expect(service.create).toHaveBeenCalledWith(dto, mockUser);
  });

  it('should call service.getAvailableRecipients', async () => {
    await controller.getRecipients(mockUser, 'test', 'class-1');
    expect(service.getAvailableRecipients).toHaveBeenCalledWith(mockUser, {
      search: 'test',
      classId: 'class-1',
    });
  });

  it('should call service.getStats', async () => {
    await controller.getStats(mockUser);
    expect(service.getStats).toHaveBeenCalledWith(mockUser);
  });

  it('should call service.findAll', async () => {
    const filters = { page: 1, limit: 10 };
    await controller.findAll(filters as any, mockUser);
    expect(service.findAll).toHaveBeenCalledWith(filters, mockUser);
  });

  it('should call service.findOne', async () => {
    await controller.findOne('11111111-1111-1111-1111-111111111111', mockUser);
    expect(service.findOne).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      mockUser,
    );
  });

  it('should call service.updateStatus', async () => {
    const dto = { status: RequestComplaintStatus.RESOLVED };
    await controller.updateStatus('11111111-1111-1111-1111-111111111111', dto, mockUser);
    expect(service.updateStatus).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      dto,
      mockUser,
    );
  });

  it('should call service.addComment', async () => {
    const dto = { message: 'Hello' };
    await controller.addComment('11111111-1111-1111-1111-111111111111', dto, mockUser);
    expect(service.addComment).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      dto,
      mockUser,
    );
  });

  it('should call service.remove', async () => {
    await controller.remove('11111111-1111-1111-1111-111111111111', mockUser);
    expect(service.remove).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      mockUser,
    );
  });
});
