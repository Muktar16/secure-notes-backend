import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    const { password: _pw, ...result } = user.toObject();
    return result;
  }

  async login(user: any) {
    const payload = { sub: user._id, email: user.email, role: user.role };
    const { password: _pw, ...userInfo } = user;
    return {
      access_token: this.jwtService.sign(payload),
      user: userInfo,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
    });

    const { password: _pw, ...result } = user.toObject();
    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }
}
