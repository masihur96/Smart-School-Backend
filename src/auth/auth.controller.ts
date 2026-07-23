import { Controller, Post, Body, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Generate access token by refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }

  @Get('profile')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: { user: { userId: string } }) {
    return await this.authService.getCurrentUser(req.user.userId);
  }

  @Post('change-password')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(
    @Request() req: { user: { userId: string } },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.authService.changePassword(
      req.user.userId,
      changePasswordDto,
    );
  }
}
