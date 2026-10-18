import { Request, Response, NextFunction } from 'express';
import { UserRegistrationService } from '../../use-cases/RegisterUserUseCase';
import { UserLoginService } from '../../use-cases/LoginUseCase';

export class AuthController {
  constructor(
    private readonly registrationService: UserRegistrationService,
    private readonly loginService: UserLoginService,
  ) {}

  handleRegister = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.registrationService.execute(req.body);
      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  handleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.loginService.execute(req.body);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
