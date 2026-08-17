import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(dto: CreateUserDto): Promise<UserDocument>;
    findAll(page: number, limit: number): Promise<PaginatedResult<UserDocument>>;
    findById(id: string): Promise<UserDocument>;
    findByEmail(email: string): Promise<UserDocument | null>;
    update(id: string, dto: UpdateUserDto): Promise<UserDocument>;
    remove(id: string): Promise<void>;
    groupByInterests(): Promise<any[]>;
}
