import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-types="npm:@types/express"
import express from "npm:express@4.21.2";

console.log("Hello from the Hello-World Function!");

const app = express();
const port = 8000;
app.use(express.json());

app.get("/hello-world", (req, res) => {
  res.send("Hello World!");
});

app.get("/hello-world/:id", (req, res) => {
  res.send(`Hello World with id ${req.params.id}!`);
});

app.post("/hello-world", (req, res) => {
  const { name } = req.body;
  res.send(`Hello ${name}!`);
});

app.listen(port, (error) => {
  if (error) {
    return console.error(`Error listening: ${error}`);
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello-world' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
