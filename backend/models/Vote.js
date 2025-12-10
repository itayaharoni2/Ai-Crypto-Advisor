import mongoose from "mongoose"; // for MongoDB

// New mogoose scema - defines the shape of the documents
const voteSchema = new mongoose.Schema(
  {
    // saves the user that voted (must be in DB)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // string, multi choice section, required
    section: {
      type: String,
      enum: ["news", "prices", "ai_insight", "meme"],
      required: true,
    },
    // defines the ID of the specific item
    itemId: {
      type: String,
      required: true,
    },
    // saves the vote (up /down)
    vote: {
      type: String,
      enum: ["up", "down"],
      required: true,
    },
  },
  {
    // saves the time of the vote
    timestamps: true,
  }
);

// avoid duplicate votes for the same item by the same user
voteSchema.index({ userId: 1, section: 1, itemId: 1 }, { unique: true });

// creates the model vote in the DB
const Vote = mongoose.model("Vote", voteSchema);

// for the rest of the backend
export default Vote;
