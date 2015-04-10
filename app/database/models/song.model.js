var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var objectId = mongoose.Schema.Types.ObjectId;

var SongSchema = new Schema({
  name:{
    type: String,
    required: true,
    unique: false,
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
  upvotes: {
    type: Number,
    required: true
  },
  downvotes: {
    type: Number,
    required: true
  },
  tags: [new Schema({
       tagname:{
        type:String
       },
       views:{
        type:Number
       },
       upvotes:{
         type:Number
       },
       downvotes:
       {
         type:Number
       }
    })],
   description: {
    type: String
  },
  upvoteList: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  downvoteList: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  ratedList:{
    type: [{ type: String }]
  },
  createdAt:{
    type: Object
  },
  filepath:{
    type: String,
    required: true,
    unique: true,
    trim: true
  }

});

module.exports = Song = mongoose.model('Song', SongSchema);
