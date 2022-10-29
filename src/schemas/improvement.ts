import * as mongoose from 'mongoose';

const improvementSchema = new mongoose.Schema({
    context: { type: String },
})

export default mongoose.model<mongoose.Document>("Improvement", improvementSchema);