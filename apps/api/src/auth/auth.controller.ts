import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiEndpoint } from '../common/openapi.decorators';
import {
  AcceptedResponseDto,
  AuthTokensResponseDto,
  ResetResponseDto,
  RevokedResponseDto,
  SignupResponseDto,
  UserResponseDto,
  VerifiedResponseDto,
} from '../common/openapi.models';
import { CurrentUser, Public, type AuthUser } from '../common/auth-context';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  ResetPasswordDto,
  SignupDto,
  TokenDto,
  UpdateMeDto,
} from '../common/dto';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}
  @ApiEndpoint({
    summary: 'Create an account',
    description:
      'Creates a pending account with an Argon2id password hash and enqueues a single-use email verification token. The token is never returned.',
    response: SignupResponseDto,
    created: true,
    public: true,
  })
  @Public()
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto.name, dto.email, dto.password);
  }
  @ApiEndpoint({
    summary: 'Verify an email address',
    description:
      'Consumes a valid, unexpired verification token exactly once and activates the account.',
    response: VerifiedResponseDto,
    created: true,
    public: true,
  })
  @Public()
  @Post('verify-email')
  verify(@Body() dto: TokenDto) {
    return this.auth.verifyEmail(dto.token);
  }
  @ApiEndpoint({
    summary: 'Create an authenticated session',
    description:
      'Validates credentials and email verification, then returns a short-lived access token and rotating refresh token.',
    response: AuthTokensResponseDto,
    created: true,
    public: true,
  })
  @Public()
  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Headers('user-agent') ua: string | undefined,
    @Ip() ip: string,
  ) {
    return this.auth.login(dto.email, dto.password, ua, ip);
  }
  @ApiEndpoint({
    summary: 'Rotate a refresh token',
    description:
      'Consumes the supplied refresh token and returns a replacement token pair. Reuse revokes the entire token family.',
    response: AuthTokensResponseDto,
    created: true,
    public: true,
  })
  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }
  @ApiEndpoint({
    summary: 'Request a password reset',
    description:
      'Always returns accepted to prevent account enumeration. For an existing account, a single-use reset token is enqueued for email delivery.',
    response: AcceptedResponseDto,
    created: true,
    public: true,
  })
  @Public()
  @Post('forgot-password')
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }
  @ApiEndpoint({
    summary: 'Reset an account password',
    description:
      'Consumes a valid reset token once, replaces the Argon2id password hash, and revokes active sessions.',
    response: ResetResponseDto,
    created: true,
    public: true,
  })
  @Public()
  @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }
  @ApiBearerAuth()
  @ApiEndpoint({
    summary: 'Revoke a session',
    description:
      'Revokes the session identified by the supplied refresh token. The operation remains successful if already revoked.',
    response: RevokedResponseDto,
    created: true,
  })
  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }
  @ApiEndpoint({
    summary: 'Get the current account',
    description:
      'Returns the authenticated user profile without password hashes, session tokens, or one-time tokens.',
    response: UserResponseDto,
  })
  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        organizationName: true,
        status: true,
        emailVerifiedAt: true,
      },
    });
  }
  @ApiEndpoint({
    summary: 'Update the current account',
    description:
      'Updates the caller’s display name and optional organization name.',
    response: UserResponseDto,
  })
  @ApiBearerAuth()
  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.prisma.user.update({
      where: { id: user.id },
      data: dto,
      select: { id: true, email: true, name: true, organizationName: true },
    });
  }
}
