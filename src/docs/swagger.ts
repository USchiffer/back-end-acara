import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    version: '1.0.0',
    title: 'Dokumentasi API Back-End Acara',
    description: 'Dokumentasi API untuk aplikasi Back-End Acara',
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Local server',
    },
    {
      url: 'https://back-end-acara-three-silk.vercel.app/api',
      description: 'Deployed server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    },
    schemas: {
      loginRequest: {
        identifier: 'Aditya',
        password: ' 1234',
      },
      RegisterRequest: {
        fullName: 'Aditya',
        username: 'aditya123',
        email: 'kakaaditya@yopmail.com',
        password: '1234',
        confirmPassword: '1234',
      },
      ActivationRequest: {
        code: 'abcdefg',
      },
    },
  },
};
const outputFile = './swagger_output.json';
const endpointsFiles = ['../routes/api.ts '];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);
