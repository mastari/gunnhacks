import mongoose from 'mongoose';
const {Schema, ObjectId} = mongoose;

const gameSchema = new Schema({
  game: Object,
  winners: [{ type: ObjectId }]
});

const Game = mongoose.model('Game', gameSchema);

export {Game}
