import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserTypeModel } from "../Models/UserModel.js";
import { config } from 'dotenv'
config();    //process.env

//register function
export const register = async (userObj) => {
  //create document
  const userDoc = new UserTypeModel(userObj);
  //validate for empty passwords
  await userDoc.validate();
  //hash and replace plain password
  console.log("Hashing password for user:", userObj.email);
  userDoc.password = await bcrypt.hash(userDoc.password, 10);
  //save
  console.log("Saving user doc to DB...");
  const created = await userDoc.save();
  //convert document to object to remove password
  const newUserObj = created.toObject();
  //remove password
  delete newUserObj.password;
  //return user obj without password
  return newUserObj;
};

//authentication function
export const authenticate = async ({ email, password }) => {
  //check user with email & role
  const user = await UserTypeModel.findOne({ email });
  if (!user) {
    const err = new Error("Invalid email");
    err.status = 401;
    throw err;
  }
  //compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error("Invalid password");
    err.status = 401;
    throw err;
  }
  //check if user is active or not
  if (user.isActive === false) {
    const err = new Error("user is blocked,please contact the admin");
    err.status = 403;
    throw err;
  }
  //generate token
  const token = jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const userObj = user.toObject();
  delete userObj.password;

  return { token, user: userObj };
};