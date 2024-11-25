import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = 4000;

app.use(cors());

app.get('/api/biocontext/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const response = await axios.get(`https://chaturbate.com/api/biocontext/${username}`);
    return {
        data: res.json(response.data),
        status: 200
    }
  } catch (error) {
    console.error(error.response.statusText);
    return {
        data: {},
        status: res.statusText
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
