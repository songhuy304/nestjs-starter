import { CacheService } from '@/common/cache/services/cache.service';
import { UserEntity } from '@/common/database/entities/user.entity';
import { ERROR_CODE } from '@/common/filters/error-code';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@/common/filters/exception';
import { HelperEncryptionService } from '@/common/helper/services/helper.encryption.service';
import { IAuthUser } from '@/common/request/interfaces';
import { ApiGenericResponseDto, ApiResponseDto } from '@/common/response';
import { generateCode } from '@/common/utils';
import { TokenService } from '@/modules/token/services/token.service';
import { UserRepositoryImpl } from '@/modules/users/repositories/user.repository';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  SignupDto,
  UserOauthDto,
} from '../dtos/request';
import { AuthRefreshResponseDto, LoginResponseDto } from '../dtos/response';
import { EAuthProvider } from '../enums';
import { IAuthService } from '../interfaces/auth.service.interface';
import { AuthMailService } from './auth.mail.service';

const FORGOT_PASSWORD_KEY = 'forgot_password:';

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);
  private frontendUrl: string;

  constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly helperEncryptionService: HelperEncryptionService,
    private readonly authMailService: AuthMailService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly cacheService: CacheService,
  ) {
    this.frontendUrl = this.configService.getOrThrow('app.frontend');
  }

  public async login(
    input: LoginDto,
  ): Promise<ApiResponseDto<LoginResponseDto>> {
    const user = await this.validateUser(input.identifier, input.password);

    const tokens = await this.helperEncryptionService.createJwtTokens({
      userId: user.id,
      role: user.role,
      tv: user.tokenVersion,
    });

    return ApiResponseDto.success(tokens);
  }

  public async signup(payload: SignupDto): Promise<ApiGenericResponseDto> {
    await this.validateUser(payload.email, payload.password);

    const hashPassword = await this.helperEncryptionService.createHash(
      payload.password,
    );
    await this.userRepository.create({ ...payload, password: hashPassword });

    return ApiGenericResponseDto.success('Register success');
  }

  public async logout(payload: IAuthUser): Promise<ApiGenericResponseDto> {
    await this.userRepository.incrementTokenVersion(payload.userId);
    return ApiGenericResponseDto.success();
  }

  public async forgotPassword(
    payload: ForgotPasswordDto,
  ): Promise<ApiGenericResponseDto> {
    const user = await this.userRepository.findByEmail(payload.email);

    if (!user) {
      throw new NotFoundException(ERROR_CODE.NOT_FOUND);
    }
    const token = generateCode(32);
    const ttl = 10 * 60 * 1000;
    await this.cacheService.set(FORGOT_PASSWORD_KEY + token, user.id, ttl);

    await this.authMailService.forgotPasswordMail(user, token);
    return ApiGenericResponseDto.success();
  }

  public async resetPassword(
    payload: ResetPasswordDto,
  ): Promise<ApiGenericResponseDto> {
    const { token, password } = payload;

    const userId = await this.cacheService.get<number>(
      FORGOT_PASSWORD_KEY + token,
    );

    if (!userId) {
      throw new UnauthorizedException(ERROR_CODE.TOKEN_INVALID);
    }

    const passwordHash =
      await this.helperEncryptionService.createHash(password);

    await this.userRepository.update(userId, {
      password: passwordHash,
    });

    await this.cacheService.del(FORGOT_PASSWORD_KEY + token);

    return ApiGenericResponseDto.success('Reset password success');
  }

  public async refreshTokens(
    authUser: IAuthUser,
  ): Promise<ApiResponseDto<AuthRefreshResponseDto>> {
    const user = await this.userRepository.findById(authUser.userId);

    if (!user || user.tokenVersion !== authUser.tv) {
      throw new UnauthorizedException(ERROR_CODE.TOKEN_INVALID);
    }

    const tokens = await this.helperEncryptionService.createJwtTokens({
      userId: user.id,
      role: user.role,
      tv: user.tokenVersion,
    });

    return ApiResponseDto.success(tokens);
  }

  public async validateOAuthLogin(payload: UserOauthDto): Promise<string> {
    let user = await this.userRepository.findByEmail(payload.email);

    if (!user) {
      user = await this.createOAuthUser(payload);
    } else if (user.provider && user.provider !== payload.provider) {
      throw new BadRequestException(ERROR_CODE.EMAIL_PROVIDER_CONFLICT);
    }

    const token = await this.helperEncryptionService.createToken(
      {
        userId: user.id,
      },
      { expiresIn: '15m' },
    );

    return `${this.frontendUrl}/auth/verify?token=${token}`;
  }

  public async verifyOAuthToken(
    token: string,
  ): Promise<ApiResponseDto<LoginResponseDto>> {
    let payload: { userId: number };

    try {
      payload = await this.helperEncryptionService.verifyToken<{
        userId: number;
      }>(token);
    } catch {
      throw new UnauthorizedException(ERROR_CODE.TOKEN_INVALID);
    }

    const user = await this.userRepository.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedException(ERROR_CODE.TOKEN_INVALID);
    }

    const tokens = await this.helperEncryptionService.createJwtTokens({
      userId: user.id,
      role: user.role,
      tv: user.tokenVersion,
    });

    return ApiResponseDto.success(tokens);
  }

  private async createOAuthUser(payload: UserOauthDto): Promise<UserEntity> {
    try {
      return await this.userRepository.create({
        email: payload.email,
        fullName: payload.fullName,
        avatar: payload.avatar || null,
        provider: payload.provider,
        isVerified: true,
      });
    } catch (error) {
      this.logger.error('Error creating OAuth user', error);

      throw new BadRequestException(
        `Failed to create OAuth user: ${error.message}`,
      );
    }
  }

  private async validateUser(
    identifier: string,
    password: string,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findByEmail(
      identifier,
      EAuthProvider.LOCAL,
    );

    if (!user) {
      throw new UnauthorizedException(ERROR_CODE.INVALID_CREDENTIALS);
    }

    const isMatch = await this.helperEncryptionService.match(
      user.password,
      password,
    );

    if (!isMatch) {
      throw new UnauthorizedException(ERROR_CODE.INVALID_CREDENTIALS);
    }

    return user;
  }
}
