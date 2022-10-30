import * as mongoose from 'mongoose';

const certificationSchema = new mongoose.Schema({
    userId: { type: String },
    verifyCode: { type: String },
})

export default mongoose.model<mongoose.Document>("Certification", certificationSchema);
