import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';

export const BCRYPT_ROUNDS = 12;

// Comparing against a throwaway hash when the email is unknown keeps the
// response time of "no such user" and "wrong password" indistinguishable,
// so login cannot be used to enumerate registered emails.
const DUMMY_HASH = bcrypt.hashSync('unknown-user-placeholder', BCRYPT_ROUNDS);

export interface PublicUser {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  interests: string[];
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<PublicUser | null> {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .lean();

    const isMatch = await bcrypt.compare(
      password,
      user?.password ?? DUMMY_HASH,
    );
    if (!user || !isMatch) return null;

    const { password: _hash, ...safe } = user;
    return safe as PublicUser;
  }

  login(user: PublicUser) {
    return {
      access_token: this.signToken(user),
      user,
    };
  }

  async register(dto: RegisterDto) {
    // No pre-flight "does this email exist" read: the unique index on
    // users.email is the source of truth, and a duplicate surfaces as a 409
    // via MongooseExceptionFilter. This closes the check-then-act race where
    // two simultaneous registrations both pass the check.
    const created = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      interests: dto.interests ?? [],
    });

    const user = created.toObject() as unknown as PublicUser;
    return {
      access_token: this.signToken(user),
      user,
    };
  }

  async profile(userId: string): Promise<PublicUser> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');
    return user as unknown as PublicUser;
  }

  private signToken(user: PublicUser) {
    return this.jwtService.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });
  }
}
