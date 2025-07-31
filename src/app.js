import app from "./index.js";

const port = process.env.PORT;

app
  .listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  })
  .on("error", (err) => {
    console.log(err);
  });
