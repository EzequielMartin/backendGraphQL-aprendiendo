const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { v1: uuid } = require("uuid");
const { GraphQLError } = require("graphql");

let persons = [
  {
    name: "Arto Hellas",
    phone: "040-123543",
    street: "Tapiolankatu 5 A",
    city: "Espoo",
    id: "3d594650-3436-11e9-bc57-8b80ba54c431",
  },
  {
    name: "Matti Luukkainen",
    phone: "040-432342",
    street: "Malminkaari 10 A",
    city: "Helsinki",
    id: "3d599470-3436-11e9-bc57-8b80ba54c431",
  },
  {
    name: "Venla Ruuska",
    street: "Nallemäentie 22 C",
    city: "Helsinki",
    id: "3d599471-3436-11e9-bc57-8b80ba54c431",
  },
];

const typeDefs = `#graphql
  type Address {
    street: String!
    city: String!
  }

  type Person {
    name: String!
    phone: String
    address: Address!
    id: ID!
  }

  enum YesNo {
  YES
  NO
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person!]!
    findPerson(name: String!): Person
  }

  type Mutation {
  addPerson(
    name: String!
    phone: String
    street: String!
    city: String!
  ): Person

  editNumber(
    name: String!
    phone: String!
  ): Person
  }
`;

const resolvers = {
  Query: {
    personCount: () => persons.length,
    allPersons: (root, args) => {
      //Si no paso el parametro phone me devuelve todas las personas
      if (!args.phone) {
        return persons;
      }
      //Si paso el parametro phone:
      //El (person) representar a cada persona del array persons que es el que llama a la funcion filter que a su vez llama a esta funcion byPhone que
      const byPhone = (person) =>
        //Si el parametro es YES me devuelve las personas que tienen definido un phone, sino me devuelve las que no tienen definido un phone
        //Si args.phone === "YES" el byPhone va a valer person.phone, si este person.phone es distinto de null el elemento se va a conservar y se va a retornar,
        //si el person.phone es igual a null se va a filtar y no se va a mostrar.
        //Esto es porque el filter() conserva los elementos para los que byPhone(person) es true
        //y cualquier valor numerico, por ejemplo "040-123543", es truty, pero "null" es falsy.
        //Cuando args.phone === "NO" pasa el caso contrario, me devuelve solo los que no tienen un telefono definido
        args.phone === "YES" ? person.phone : !person.phone;
      return persons.filter(byPhone);

      //Tambien se puede hacer usando if-else de forma explicita asi:

      // if (!args.phone) {
      //   return persons;
      // } else {
      //   if (args.phone === "YES") {
      //     return persons.filter((person) => person.phone);
      //   } else {
      //     return persons.filter((person) => !person.phone);
      //   }
      // }
    },
    findPerson: (root, args) => persons.find((p) => p.name === args.name),
  },
  Person: {
    address: (root) => {
      return {
        street: root.street,
        city: root.city,
      };
    },
  },
  Mutation: {
    addPerson: (root, args) => {
      if (persons.find((p) => p.name === args.name)) {
        throw new GraphQLError("Name must be unique", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.name,
          },
        });
      }

      const person = { ...args, id: uuid() };
      persons = persons.concat(person);
      return person;
    },
    editNumber: (root, args) => {
      const person = persons.find((p) => p.name === args.name);
      if (!person) {
        return null;
      } else {
        const updatedPerson = { ...person, phone: args.phone };
        persons = persons.map((p) =>
          p.name === args.name ? updatedPerson : p
        );
        return updatedPerson;
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
