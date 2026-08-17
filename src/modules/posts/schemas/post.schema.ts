import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  content: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Index 4 — the only index posts need.
// Serves: the Scenario 2 pipeline's $match on userId *and* its $sort by
// _id desc, so the aggregation never performs a blocking in-memory sort.
// The $lookup into users resolves on users._id (default index).
PostSchema.index({ userId: 1, _id: -1 });
