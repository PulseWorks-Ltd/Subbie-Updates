const config = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost/placeholder",
    },
  },
};

export default config;
