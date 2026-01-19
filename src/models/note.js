import mongoose from "mongoose";

const noteSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    tag: {
      type: String,
      required: false,
      enum: ["Work", "Personal", "Meeting", "Shopping", "Ideas", "Travel", "Finance", "Health", "Important", "Todo"],
      default: "Todo",
    },
  },
  {
    timestamps: true,
  }
);
export const Note = mongoose.model("Note", noteSchema);