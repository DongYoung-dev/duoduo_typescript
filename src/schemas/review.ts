import * as mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    reviewedId: { type: String },
    reviewerId: { type: [String] },
    goodReview: [
        {
            description: { type: String },
            count: { type: Number },
        },
    ],
    badReview: [
        {
            description: { type: String },
            count: { type: Number },
        },
    ],
})

export default mongoose.model<mongoose.Document>("Review", reviewSchema);
