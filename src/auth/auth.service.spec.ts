import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const ADMIN_EMAIL = 'admin@liliapaws.com';
  const ADMIN_PASSWORD = 'secret123';
  const FAKE_TOKEN = 'signed.jwt.token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue(FAKE_TOKEN),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ADMIN_EMAIL') return ADMIN_EMAIL;
              if (key === 'ADMIN_PASSWORD') return ADMIN_PASSWORD;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('login', () => {
    it('should return a token when credentials are valid', () => {
      const result = service.login(ADMIN_EMAIL, ADMIN_PASSWORD);

      expect(result).toEqual({ token: FAKE_TOKEN });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'admin',
        email: ADMIN_EMAIL,
      });
    });

    it('should throw UnauthorizedException when email is wrong', () => {
      expect(() => service.login('wrong@email.com', ADMIN_PASSWORD)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is wrong', () => {
      expect(() => service.login(ADMIN_EMAIL, 'wrongpassword')).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when both credentials are wrong', () => {
      expect(() => service.login('wrong@email.com', 'wrongpassword')).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw with "Invalid credentials" message', () => {
      expect(() => service.login('wrong@email.com', 'wrong')).toThrow(
        'Invalid credentials',
      );
    });

    it('should read credentials from ConfigService', () => {
      service.login(ADMIN_EMAIL, ADMIN_PASSWORD);

      expect(configService.get).toHaveBeenCalledWith('ADMIN_EMAIL');
      expect(configService.get).toHaveBeenCalledWith('ADMIN_PASSWORD');
    });
  });

  describe('me', () => {
    it('should return the email in an object', () => {
      const email = 'user@example.com';
      expect(service.me(email)).toEqual({ email });
    });
  });
});
