import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILastMessage {
  content: string;
  sender: string;
  createdAt: Date;
}

export interface IRoomDoc extends Document {
  name: string;
  description?: string;
  slug: string;
  type: "public" | "private";
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  lastMessage?: ILastMessage;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoomDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    description: { type: String, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    type: { type: String, enum: ["public", "private"], default: "public" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessage: {
      content: String,
      sender: String,
      createdAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

RoomSchema.virtual("memberCount").get(function () {
  return this.members.length;
});

RoomSchema.index({ type: 1 });
RoomSchema.index({ members: 1 });
RoomSchema.index({ slug: 1 });

// Generate slug from name
RoomSchema.pre("validate", function (next) {
  if (this.isNew && this.name && !this.slug) {
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Math.random().toString(36).slice(2, 6);
  }
  next();
});

const Room: Model<IRoomDoc> =
  mongoose.models.Room ?? mongoose.model<IRoomDoc>("Room", RoomSchema);

export default Room;
