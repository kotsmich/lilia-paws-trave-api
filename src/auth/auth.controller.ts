import { Controller, Post, Get, Patch, Body, UseGuards, Request, Res, HttpCode, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { AdminGuard } from './admin.guard';
import { LoginDto } from './login.dto';
import { ChangePasswordDto } from './change-password.dto';
import { ChangeEmailDto } from './change-email.dto';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
import { AdminRole } from './admin-user.entity';
import { SESSION_TTL_MS } from './session.constants';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Authenticate and set HttpOnly JWT cookie' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: { id: string; email: string; role: AdminRole } }> {
    const { token, user } = await this.authService.login(body.email, body.password);
    this.setAuthCookie(res, token);
    return { user };
  }

  @ApiOperation({ summary: 'Clear the auth cookie and end the session' })
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie('admin_token', { httpOnly: true, sameSite: 'strict' });
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: { user: { userId: string } }): Promise<{ id: string; email: string; role: AdminRole }> {
    return this.authService.me(req.user.userId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Patch('profile/password')
  async changePassword(
    @Request() req: { user: { userId: string } },
    @Body() body: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user email' })
  @UseGuards(JwtAuthGuard)
  @Patch('profile/email')
  async changeEmail(
    @Request() req: { user: { userId: string } },
    @Body() body: ChangeEmailDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ email: string }> {
    const { token, email } = await this.authService.changeEmail(req.user.userId, body.currentPassword, body.newEmail);
    this.setAuthCookie(res, token);
    return { email };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users (admin only)' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('users')
  listUsers(): Promise<{ id: string; email: string; role: AdminRole }[]> {
    return this.authService.listUsers();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user email or role (admin only)' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ): Promise<{ id: string; email: string; role: AdminRole }> {
    return this.authService.updateUser(id, body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new admin or operator user (admin only)' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('users')
  async createUser(@Body() body: CreateUserDto): Promise<{ id: string; email: string; role: AdminRole }> {
    return this.authService.createUser(body.email, body.password, body.role);
  }

  private setAuthCookie(res: Response, token: string): void {
    res.cookie('admin_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env['NODE_ENV'] === 'production',
      maxAge: SESSION_TTL_MS,
    });
  }
}
