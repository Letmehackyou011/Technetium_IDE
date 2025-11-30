const express = require('express');
const app = express();
app.use(express.json());


app.get('/health', (req, res) => res.json({ ok: true }));


app.post('/v1/completions', (req, res) => {
  const prompt = req.body.prompt || '';
  const reply = `// Mock completion for prompt: ${prompt.slice(0,60)}\nconsole.log("Hello from mock model");`;
  res.json({ choices: [{ text: reply }] });
});


const PORT = process.env.PORT || 11434;
app.listen(PORT, () => console.log(`Mock model server running on ${PORT}`));