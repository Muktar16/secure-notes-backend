import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NoteDocument = HydratedDocument<Note>;

@Schema({ timestamps: true })
export class Note {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  content: string;
}

export const NoteSchema = SchemaFactory.createForClass(Note);

// Index 3 — the only index notes need.
// Serves: GET /notes for a user (equality on userId + sort by _id desc +
// skip/limit, all from the index) and the ownership check on
// GET/PUT/DELETE /notes/:id. Admin's unfiltered list sorts on _id and is
// served by the default _id index, so no second index is warranted.
// _id is used as the chronological sort key because ObjectIds are
// monotonic by creation time — this avoids a redundant createdAt index.
NoteSchema.index({ userId: 1, _id: -1 });
