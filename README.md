# API-Imagenes

This repository contains a Node.js application that downloads and compresses images from a PostgreSQL database and serves them through an Express server.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Endpoints](#endpoints)
- [License](#license)

## Installation

1. Clone the repository:
  ```sh
  git clone https://github.com/iAndres-T/API-Imagenes.git
  cd API-Imagenes
  ```

2. Install the dependencies:
  ```sh
  npm install
  ```

3. Create a `.env` file in the root directory and add the required environment variables (see [Environment Variables](#environment-variables)).

## Usage

Start the server:
```sh
npm start
```

The server will be running at `http://localhost:3000`.

## Environment Variables

Create a `.env` file in the root directory and add the following variables:

```env
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
DB_PORT=your_db_port
```

## Endpoints

### GET /descargar-imagenes

Downloads and compresses images from the database.

## License

This project is licensed under the MIT License.
