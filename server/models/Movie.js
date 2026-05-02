const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    posterPath: String,
    videoPath: {
        type: String,
        required: true
    },
    genre: [String],
    releaseDate: Date,
    duration: Number,
    isCustom: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Movie', MovieSchema);
