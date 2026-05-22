import {Schema,model} from "mongoose"


//cereate user comment schema

const userCommentSchema=new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"user"
    },

    comment:{
        type:String
    }

}, { timestamps: true })

const articleSchema=new Schema({
    author:{
        type:Schema.Types.ObjectId,
        ref:"user",
        required:[true,"Author is required"]
    },
    title:{
        type:String,
        required:[true,"Title is required"]
    },

    category:{
        type:String,
        required:[true,"Category is required"]
    },
    content:{
        type:String,
        required:[true,"Content is required"]
    },
    comments:[userCommentSchema],
    isArticleActive:{
        type:Boolean,
        default:true
    },},
    {
        timestamps:true,
        strict:"throw",
        versionKey:false
    },
)


export const ArticleModel=model("article",articleSchema)