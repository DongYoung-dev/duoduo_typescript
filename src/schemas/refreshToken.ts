import * as mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
    userId: { type: String },
    refreshToken: { type: String },
})

export default mongoose.model<mongoose.Document>("RefreshToken", refreshTokenSchema);