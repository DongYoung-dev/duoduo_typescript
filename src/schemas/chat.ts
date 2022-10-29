import * as mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
    {
        userId: { type: String },
        roomId: { type: String },
        text: {
            type: String,
        },
        date: {
            type: String,
        },
        isRead: {
            type: Boolean,
        },
    },
    { timestamps: true }
)

export default mongoose.model<mongoose.Document>("Chat", chatSchema);