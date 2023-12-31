const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET || 'fallbackSecretKey';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Name is required'
  },
  email: {
    type: String,
    trim: true,
    unique: 'Email already exists',
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    required: 'Email is required'
  },
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  },
  hashed_password: {
    type: String,
    required: 'Password is required'
  },
  salt: String                                                                  
});

// Virtual field for handling the plain text password
UserSchema.virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

// Validate the length of the password
UserSchema.path('hashed_password').validate(function(v) {
  if (this._password && this._password.length < 6) {
    this.invalidate('password', 'Password must be at least 6 characters.');
  }
  if (this.isNew && !this._password) {
    this.invalidate('password', 'Password is required');
  }
}, null);

// Methods for encrypting the password, creating a salt, and generating JWT token
UserSchema.methods = {
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },
  encryptPassword: function(password) {
    if (!password || !this.salt) return '';
    return require('crypto')
      .createHmac('sha1', this.salt)
      .update(password)
      .digest('hex');
  },
  makeSalt: function() {
    return Math.round(new Date().valueOf() * Math.random()) + '';
  },
  generateAuthToken: function() {
    const token = jwt.sign({ _id: this._id }, secretKey); // Replace 'yourSecretKey' with a secure secret key
    return token;
  },
};

module.exports = mongoose.model('User', UserSchema);
