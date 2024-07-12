const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  PORT == 3000
    ? console.log(`Server is running on http://localhost:${PORT}`)
    : console.log(`Server is running on port ${PORT}`);
});
