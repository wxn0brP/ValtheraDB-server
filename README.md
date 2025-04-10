# <img src="./gui/favicon.svg" alt="ValtheraDB" style="width: 32px;"> ValtheraDB server

A simple file-based database server that leverages the @wxn0brp/db library.
For more details, visit [this link](https://github.com/wxn0brP/ValtheraDB).

## Features

- Built on top of the @wxn0brp/db library.
- Simple configuration with a `.env` file.
- Management and server control commands included.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/wxn0brP/ValtheraDB-server.git
cd ValtheraDB-server
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

### GUI

First, Compile the GUI:
```bash
cd gui-script
yarn
yarn build
```

Now, enable the GUI on .env:
```bash
gui=true
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on the [GitHub repository](https://github.com/wxn0brP/ValtheraDB-server).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
