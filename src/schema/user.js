import mongoose from 'mongoose';
const {Schema, ObjectId} = mongoose;

const userSchema = new Schema({
  username: String,
  userId: String,
  wins: [{ type: ObjectId }]
});

const User = mongoose.model('User', userSchema);

export {User}
