# @wxn0brp/db-server

A simple file-based database server that leverages the @wxn0brp/db library.
For more details, visit [this link](https://github.com/wxn0brP/database).

## Features

- Built on top of the @wxn0brp/db library.
- Simple configuration with a `.env` file.
- Management and server control commands included.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/wxn0brP/database-server.git
   cd database-server
   ```

2. Install dependencies:

   ```bash
   yarn
   ```

3. Build the project:

   ```bash
   yarn build
   ```

## First Configuration

Copy the example `.env` file to create your configuration file:

```bash
cp .env.example .env
```

Edit the `.env` file to suit your environment and requirements.

## Usage

### Manage Server

Use the management command to configure or control the server:

```bash
yarn mgmt
```

### Run Server

Start the database server with the following command:

```bash
yarn start
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on the [GitHub repository](https://github.com/wxn0brP/database-server).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
