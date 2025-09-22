import mongoose from 'mongoose';
import { encrypt } from '../utils/encryption';

import { renderMailHtml, sendMail } from '../utils/mail/mail';
import { CLIENT_HOST, EMAIL_SMTP_USER } from '../utils/env';

export interface User {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: string;
  profilePicture: string;
  isActive: boolean;
  activationCode: string;
  createdAt?: string;
}
const Schema = mongoose.Schema;

const userSchema = new Schema<User>(
  {
    fullName: {
      type: Schema.Types.String,
      required: true,
    },
    username: {
      type: Schema.Types.String,
      required: true,
      unique: true,
    },
    email: {
      type: Schema.Types.String,
      required: true,
      unique: true,
    },
    password: {
      type: Schema.Types.String,
      required: true,
    },
    role: {
      type: Schema.Types.String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    profilePicture: {
      type: Schema.Types.String,
      default: 'user.jpg',
    },
    isActive: {
      type: Schema.Types.Boolean,
      default: false,
    },
    activationCode: {
      type: Schema.Types.String,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', function (next) {
  const user = this;
  user.password = encrypt(user.password);
  user.activationCode = encrypt(user.id);
  next();
});

userSchema.post('save', async function (doc, next) {
  try {
    const user = doc;
    console.log('send Email to ', user.email);
    const contentMail = await renderMailHtml('registration-success.ejs', {
      username: user.username || user.fullName,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
      activationLink: `${CLIENT_HOST}/auth/activation?code=${user.activationCode}`,
    });

    await sendMail({
      from: EMAIL_SMTP_USER,
      to: user.email,
      subject: 'Aktivasi Akun Anda',
      html: contentMail,
    });
  } catch (error) {
    console.log(error);
  } finally {
    next();
  }
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};
const UserModel = mongoose.model('User', userSchema);

export default UserModel;
