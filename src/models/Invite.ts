import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IInviteDoc extends Document {
  from: Types.ObjectId;
  to: Types.ObjectId;
  room?: Types.ObjectId;
  type: "friend" | "room";
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  updatedAt: Date;
}

const InviteSchema = new Schema<IInviteDoc>(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: Schema.Types.ObjectId, ref: "Room" },
    type: { type: String, enum: ["friend", "room"], required: true },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
  },
  {
    timestamps: true,
    toJSON: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform(_, ret) { delete (ret as any).__v; return ret; },
    },
  }
);

InviteSchema.index({ to: 1, status: 1 });
InviteSchema.index({ from: 1 });

const Invite: Model<IInviteDoc> =
  mongoose.models.Invite ?? mongoose.model<IInviteDoc>("Invite", InviteSchema);

export default Invite;
