import mongoose from "mongoose"; // for MongoDB

// New mogoose scema - defines the shape of the documents
const userSchema = new mongoose.Schema(
  {
    // the name must be a text, must have a usename, remove spaces at start and end
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // string, must have, must be unique, trimed, stored in lowecase
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // string, must have
    password: {
      type: String,
      required: true,
    },
    // saves the onboarding choices (not required)
    preferences: {
      cryptoAssets: [String], // ["BTC", "ETH"...]
      investorType: { type: String }, // "HODLer"
      contentTypes: [String], // ["News", "Charts"...]
    },
    // for new users its false, after that wont show again
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    // for eac user, for personal use
    timestamps: true,
  }
);

// create the user collection
const User = mongoose.model("User", userSchema);

// for the rest of the backend
export default User;
