import { Schema, model } from 'mongoose';
import { IComment } from '../types/types';

const commentSchema = new Schema<IComment>({

    senderId : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    receiverPostId : {
        type : Schema.Types.ObjectId,
        ref : 'Post',
        required : true
    },
    text : {
        type : String,
        required : true
    },
    replay : [{
        type : Schema.Types.ObjectId,
        ref : 'Replay'
    }]

}, {timestamps : true});


const Comment = model<IComment>('Comment', commentSchema);

export default Comment;