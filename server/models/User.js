const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    watchlist: [{
        movieId: String,
        title: String,
        posterPath: String
    }],
    continueWatching: [{
        movieId: String,
        title: String,
        posterPath: String,
        progress: Number, // Percentage or timestamp
        lastWatched: { type: Date, default: Date.now }
    }],
    isAdmin: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
