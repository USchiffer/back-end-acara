import { Request, Response } from 'express';
import * as yup from 'yup';
import UserModel from '../models/user.model';
import { encrypt } from '../utils/encryption';
import { generateToken } from '../utils/jwt';
import { IReqUser } from '../middleware/auth.middleware';

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

      res.status(200).json({
        message: 'success Registration',
        data: result,
      });
    } catch (error) {
      const err = error as unknown as Error;
      res.status(400).json({ message: err.message, data: null });
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
      //ambil data user berdasarkan identifier

      const userByIdentifier = await UserModel.findOne({
        $or: [
          {
            email: identifier,
          },
          {
            username: identifier,
          },
        ],
        isActive: true,
      });

      if (!userByIdentifier) {
        return res.status(403).json({
          message: 'user not found',
          data: null,
        });
      }
      // validasi password == password user
      const validatePassword: boolean =
        encrypt(password) === userByIdentifier.password;

      if (!validatePassword) {
        return res.status(403).json({
          message: 'user not found',
          data: null,
        });
      }

      const token = generateToken({
        id: userByIdentifier._id,
        role: userByIdentifier.role,
        createdAt: userByIdentifier.createdAt,
      });

      res.status(200).json({
        messsage: 'login Success',
        data: token,
      });
    } catch (error) {
      const err = error as unknown as Error;
      res.status(400).json({
        message: err.message,
        data: null,
      });
    }
  },

  async me(req: IReqUser, res: Response) {
    /*
     #swagger.tags = ['Auth']
     #swagger.security = [{ bearerAuth: [] }]
     */
    try {
      const user = req.user;
      const result = await UserModel.findById(user?.id);

      res.status(200).json({
        message: 'Success get user profile',
        data: result,
      });
    } catch (error) {
      const err = error as unknown as Error;
      res.status(400).json({
        message: err.message,
        data: null,
      });
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

      const user = await UserModel.findOneAndUpdate(
        {
          activationCode: code,
        },
        {
          isActive: true,
        },
        {
          new: true,
        }
      );
      res.status(200).json({
        message: 'user successfully updated',
        data: user,
      });
    } catch (error) {
      const err = error as unknown as Error;
      res.status(400).json({
        message: err.message,
        data: null,
      });
    }
  },
};
