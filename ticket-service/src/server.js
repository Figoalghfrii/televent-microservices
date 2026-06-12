require("dotenv").config();

const cors = require("cors");
const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");

const typeDefs = require("./schema/ticket.typeDefs");
const resolvers = require("./resolvers/ticket.resolver");

const app = express();
const port = process.env.PORT || 4002;

async function startServer() {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apolloServer.start();

  app.use(cors());
  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({
      message: "Ticket Service is running",
      graphql_endpoint: "/graphql",
    });
  });

  app.use("/graphql", expressMiddleware(apolloServer));

  app.listen(port, "0.0.0.0", () => {
    console.log(`Ticket Service running at http://localhost:${port}/graphql`);
  });
}

startServer();
