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
  creatorID: { 
    type: String, ref: 'User' 
  },
  creator: { 
    type: String, ref: 'User' 
  },
  views: {
    type: Number,
    required: true
  },
  group:{
    type: String
  },
  createdAt:{
    type: Object
  },
  songs: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Song' }]
  },
  songRankings: {
    type: [{}] 
  }
});



module.exports = Tag = mongoose.model('Tag', TagSchema);
