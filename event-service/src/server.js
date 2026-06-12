require("dotenv").config();

const cors = require("cors");
const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");

const typeDefs = require("./schema/event.typeDefs");
const resolvers = require("./resolvers/event.resolver");

const app = express();
const port = process.env.PORT || 4001;

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
      message: "Event Service is running",
      graphql_endpoint: "/graphql",
    });
  });

  app.use("/graphql", expressMiddleware(apolloServer));

  app.listen(port, "0.0.0.0", () => {
    console.log(`Event Service running at http://localhost:${port}/graphql`);
  });
}

startServer();
