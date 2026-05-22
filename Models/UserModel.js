import { Schema, model } from "mongoose";

const userSchema = new Schema({

    username: {
        type: String,
        required: [true, "Username is required"]
    },
    firstname: {
        type: String,
        required: [true, "First time is required"]
    },
    lastname: {
        type: String,
    },
    email: {
        type: String,
        required: [true, "Email is required"]
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    profileImageUrl: {
        type: String,
        default:""
    },
    role: {
        type: String,
        enum: ["AUTHOR", "USER", "ADMIN"],
        required: [true, "{value}is an Invalid role"],

    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {

    timestamps: true,
    strict: true,
    versionKey: false

});

export const UserTypeModel = model("user", userSchema)