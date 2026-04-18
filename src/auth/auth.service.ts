import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { School } from '../schools/entities/school.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is deactivated');
    }

    const payload = { sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    let school = null;
    if (user.schoolId) {
      school = await this.schoolRepository.findOne({ where: { schoolId: user.schoolId } });
    }

    const { password, ...userWithoutPassword } = user;
    console.debug('Login successful for user:', user.email);

    return {
      accessToken,
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        ...userWithoutPassword,
        school,
      },
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) return null;

    let school = null;
    if (user.schoolId) {
      school = await this.schoolRepository.findOne({ where: { schoolId: user.schoolId } });
    }

    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      school,
    };
  }
}
