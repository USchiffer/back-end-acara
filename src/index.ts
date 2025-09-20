import express from 'express';
import bodyParser from 'body-parser';
import router from './routes/api';
import db from './utils/database';

async function init() {
  try {
    const result = await db();

    console.log('database status', result);

    const app = express();

    app.use(bodyParser.json());

    const port = 3000;

    app.get('/', (req, res) => {
      res.status(200).json({
        message: 'Server is running',
        data: null,
      });
    });

    app.use('/api', router);

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

init();
