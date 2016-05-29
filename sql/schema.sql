CREATE TYPE roles AS enum ('user', 'admin');

CREATE TABLE users (
  uid serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  role roles
);