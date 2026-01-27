import mongoose from 'mongoose';
import { TAGS } from '../constants/tags.js';

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
      default: '',
      trim: true,
    },
    tag: {
      type: String,
      required: false,
      enum: TAGS,
      default: 'Todo',
    },
  },
  {
    timestamps: true,
  },
);
export const Note = mongoose.model('Note', noteSchema);
