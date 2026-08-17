import { HydratedDocument, Types } from 'mongoose';
export type NoteDocument = HydratedDocument<Note>;
export declare class Note {
    userId: Types.ObjectId;
    title: string;
    content: string;
}
export declare const NoteSchema: import("mongoose").Schema<Note, import("mongoose").Model<Note, any, any, any, any, any, Note>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Note, import("mongoose").Document<unknown, {}, Note, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Note & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Note, import("mongoose").Document<unknown, {}, Note, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Note & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    title?: import("mongoose").SchemaDefinitionProperty<string, Note, import("mongoose").Document<unknown, {}, Note, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Note & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    content?: import("mongoose").SchemaDefinitionProperty<string, Note, import("mongoose").Document<unknown, {}, Note, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Note & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Note>;
