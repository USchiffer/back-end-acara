import { Request, Response } from 'express';
import * as yup from 'yup';
import UserModel from '../models/user.model';
import { encrypt } from '../utils/encryption';
import { generateToken } from '../utils/jwt';
import { IReqUser } from '../utils/interface';
import response from '../utils/response';
// @ts-ignore
import dbMySQL from '../../models';
const SequelizeUser = (dbMySQL as any).User;

type TRegister = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type TLogin = {
  identifier: string;
  password: string;
};

const registerValidateSchema = yup.object({
  fullName: yup.string().required(),
  username: yup.string().required(),
  email: yup.string().email().required(),
  password: yup
    .string()
    .required()
    .min(6, 'Passsword must be at least 6 characters')
    .test(
      'at-least-one-uppercase-letter',
      'contains at least one uppercase letter',
      (value) => {
        if (!value) return false;
        const regex = /^(?=.*[A-Z])/;
        return regex.test(value);
      }
    )
    .test('at-least-one-number', 'contains at least one number', (value) => {
      if (!value) return false;
      const regex = /^(?=.*[0-9])/;
      return regex.test(value);
    }),
  confirmPassword: yup
    .string()
    .required()
    .oneOf([yup.ref('password'), ''], 'Passwords must match'),
});

export default {
  async register(req: Request, res: Response) {
    /*
     #swagger.tags = ['Auth']
     */
    const { fullName, username, email, password, confirmPassword } =
      req.body as unknown as TRegister;

    try {
      await registerValidateSchema.validate({
        fullName,
        username,
        email,
        password,
        confirmPassword,
      });

      const result = await UserModel.create({
        fullName,
        username,
        email,
        password,
      });
      try {
        await SequelizeUser.create({
          fullName,
          username,
          email,
          // Menggunakan password yang sama dengan MongoDB.
          // Jika di model Mongoose ada 'pre-save encrypt', pastikan password ini sudah ter-encrypt.
          password,
          role: 'admin', // Default role sesuai data yang kamu punya
          isActive: true,
          profilePicture: 'user.jpg', // Default sesuai data kamu
          activationCode: '', // Bisa diisi jika ada logic kodenya
        });
        console.log('Berhasil Sinkronisasi ke MySQL');
      } catch (mysqlError: any) {
        // Note: Jika MySQL gagal, kita hanya log di terminal agar tidak mengganggu user
        console.error('Gagal Sinkronisasi ke MySQL:', mysqlError.message);
      }

      response.success(res, result, 'success registration');
    } catch (error) {
      response.error(res, error, 'failed registration');
    }
  },
  async login(req: Request, res: Response) {
    /*
     #swagger.tags = ['Auth']
     #swagger.requestBody = {
       required: true,
       schema: { $ref: '#/components/schemas/loginRequest' }
  }
     */
    const { identifier, password } = req.body as unknown as TLogin;
    try {
      const { Op } = require('sequelize');

      //ambil data user berdasarkan identifier

      const userByIdentifier = await SequelizeUser.findOne({
        where: {
          [Op.or]: [{ email: identifier }, { username: identifier }],
          isActive: true,
        },
      });

      if (!userByIdentifier) {
        return response.unauthorized(res, 'user not found');
      }
      // validasi password == password user
      const validatePassword: boolean =
        encrypt(password) === userByIdentifier.password;

      if (!validatePassword) {
        return response.unauthorized(res, 'user not found');
      }

      const token = generateToken({
        id: userByIdentifier.id,
        role: userByIdentifier.role,
        createdAt: userByIdentifier.createdAt,
      });

      response.success(res, token, 'login success');
    } catch (error) {
      response.error(res, error, 'login failed');
    }
  },

  async me(req: IReqUser, res: Response) {
    /*
     #swagger.tags = ['Auth']
     #swagger.security = [{ bearerAuth: [] }]
     */
    try {
      const user = req.user;
      const result = await (dbMySQL as any).User.findByPk(user?.id);

      const userData = {
        id: result.id,
        fullName: result.fullName,
        email: result.email,
        role: result.role,
        profilePicture: result.profilePicture,
      };

      response.success(res, userData, 'success get user profile');
    } catch (error) {
      response.error(res, error, 'failed get user profile');
    }
  },
  async activation(req: Request, res: Response) {
    /*
     #swagger.tags = ['Auth']
     #swagger.requestBody = {
       required: true,
       schema: { $ref: '#/components/schemas/ActivationRequest' }
     }
     */
    try {
      const { code } = req.body as { code: string };

      const user = await SequelizeUser.findOne({
        where: { activationCode: code },
      });
      if (user) {
        await user.update({ isActive: true });
      }
      await UserModel.findOneAndUpdate(
        { activationCode: code },
        { isActive: true }
      );

      response.success(res, user, 'account activated successfully');
    } catch (error) {
      response.error(res, error, 'user is failed activated');
    }
  },
};
