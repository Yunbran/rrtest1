var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var objectId = mongoose.Schema.Types.ObjectId;



var UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  type: {
    type: String,
    required: true
  },
  createdAt:{
    type: Object
  },
  songs: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Song' }]
  },
  upvoted: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Song' }]
  },
  downvoted:{
    type: [{ type: Schema.Types.ObjectId, ref: 'Song' }]
  },
  favorite:{
    type: [{ type: Schema.Types.ObjectId, ref: 'Song' }]
  }

});



module.exports = User = mongoose.model('User', UserSchema);
