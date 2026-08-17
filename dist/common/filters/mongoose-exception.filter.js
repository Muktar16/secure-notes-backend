"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
let MongooseExceptionFilter = class MongooseExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const res = exception.getResponse();
            response.status(status).json(typeof res === 'string'
                ? { statusCode: status, message: res }
                : res);
            return;
        }
        if (exception instanceof mongoose_1.Error.CastError) {
            response.status(common_1.HttpStatus.BAD_REQUEST).json({
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: `Invalid ${exception.path}: ${exception.value}`,
            });
            return;
        }
        if (exception instanceof mongoose_1.Error.ValidationError) {
            const messages = Object.values(exception.errors).map((e) => e.message);
            response.status(common_1.HttpStatus.BAD_REQUEST).json({
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: messages,
            });
            return;
        }
        if (exception?.code === 11000) {
            const key = Object.keys(exception.keyPattern)[0];
            response.status(common_1.HttpStatus.CONFLICT).json({
                statusCode: common_1.HttpStatus.CONFLICT,
                message: `Duplicate value for field: ${key}`,
            });
            return;
        }
        response.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
        });
    }
};
exports.MongooseExceptionFilter = MongooseExceptionFilter;
exports.MongooseExceptionFilter = MongooseExceptionFilter = __decorate([
    (0, common_1.Catch)()
], MongooseExceptionFilter);
//# sourceMappingURL=mongoose-exception.filter.js.map