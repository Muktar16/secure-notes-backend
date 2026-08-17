import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private userModel;
    private jwtService;
    constructor(userModel: Model<UserDocument>, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<{
        _id: import("mongoose").Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        name: string;
        email: string;
        role: string;
        interests: string[];
        __v: number;
        id: string;
    } | null>;
    login(user: any): Promise<{
        access_token: string;
        user: any;
    }>;
    register(dto: RegisterDto): Promise<{
        access_token: string;
        user: {
            _id: import("mongoose").Types.ObjectId;
            $locals: Record<string, unknown>;
            $op: "save" | "validate" | "remove" | null;
            $where: Record<string, unknown>;
            baseModelName?: string;
            collection: import("mongoose").Collection;
            db: import("mongoose").Connection;
            errors?: import("mongoose").Error.ValidationError;
            isNew: boolean;
            schema: import("mongoose").Schema;
            name: string;
            email: string;
            role: string;
            interests: string[];
            __v: number;
            id: string;
        };
    }>;
}
