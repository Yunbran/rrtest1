var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var objectId = mongoose.Schema.Types.ObjectId;

var TagSchema = new Schema({
   name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  views: {
    type: Number,
    required: true
  },
  group:{
    type: String
  },
  songs: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Song' }]
  }
});



module.exports = Tag = mongoose.model('Tag', TagSchema);
