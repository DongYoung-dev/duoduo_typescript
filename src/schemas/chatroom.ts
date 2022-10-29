import * as mongoose from 'mongoose';

const chatroomSchema = new mongoose.Schema({
    userId: { type: [String] },
})

export default mongoose.model<mongoose.Document>("Chatroom", chatroomSchema);
