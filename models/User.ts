import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
  },
  email: {
    type: String,
    unique: true,
    sparse: true, 
  },
  password: {
    type: String,
    required: function (this: { provider?: string }) {
      return !this.provider;
    },
  },
  image: {
    type: String,
  },
  provider: {
    type: String,
    enum: ["credentials", "google"],
    default: "credentials",
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
