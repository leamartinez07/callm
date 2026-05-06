import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMessageDoc extends Document {
  content: string;
  room: Types.ObjectId;
  sender: Types.ObjectId;
  type: "text" | "system";
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessageDoc>(
  {
    content: { type: String, required: true, maxlength: 2000 },
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["text", "system"], default: "text" },
    editedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

MessageSchema.index({ room: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

const Message: Model<IMessageDoc> =
  mongoose.models.Message ?? mongoose.model<IMessageDoc>("Message", MessageSchema);

export default Message;
