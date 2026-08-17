import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  // `select: false` keeps the hash out of every query result by default.
  // Only AuthService opts back in, via .select('+password').
  @Prop({ required: true, select: false })
  password: string;

  @Prop({ enum: ['user', 'admin'], default: 'user' })
  role: string;

  @Prop({ type: [String], default: [], lowercase: true })
  interests: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Second line of defence: even if a document is loaded with the hash
// (login), serialising it can never leak it.
const stripPassword = (_doc: unknown, ret: Record<string, unknown>) => {
  delete ret.password;
  return ret;
};
UserSchema.set('toJSON', { transform: stripPassword as never });
UserSchema.set('toObject', { transform: stripPassword as never });

// Index 1 — unique email.
// Serves: login lookup (findOne by email), register/create duplicate check,
// and enforces uniqueness under concurrent registrations.
UserSchema.index({ email: 1 }, { unique: true });

// Index 2 — multikey on interests, with _id as the tie-breaking sort key.
// Serves: GET /users?interest=chess (equality on an array element, then the
// same index supplies the _id-descending page order, so no blocking sort)
// and the Scenario 1 pipeline, whose leading $match makes this index
// eligible and turns a COLLSCAN into an IXSCAN.
// Measured at 5k users: one filtered page examines 10 keys / 10 docs with
// this index, versus 100 / 100 when the planner falls back to the _id index.
// A multikey index cannot cover a query, so appending name/email would add
// index size without removing the FETCH — deliberately left out.
UserSchema.index({ interests: 1, _id: -1 });
