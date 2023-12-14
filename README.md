# Taskwiz-Server

## Installation

Clone the repo to your device.

1. Make sure you have installed yarn on your device

2. Install the node modules:

```bash
yarn install
```

3. Install the githooks:

```bash
yarn prepare
```

## Setup

4. Copy and <b>Configure</b> the [.example.env](https://github.com/RaghavKhullar/techfest-server/blob/main/.env.example ".example.env") then rename it as `.env`, then it should look like

```environment
ENV=DEV
MONGODB_URI=mongodb://localhost:27017/
PORT=4000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
....
```

5. Copy and <b>Configure</b> the [config.example.ts](https://github.com/RaghavKhullar/techfest-server/blob/main/config/config.example.ts "config.example.ts") then rename it as `config.ts`, then it should look like

```typescript
const config = {
    db: "techfest-taskwiz",
    port: parseInt(process.env.PORT ?? "4000"),
  };
  
export default config;
```

6. Start the server in development mode:

```bash
yarn run dev
```

The server should be ruuning at your local host port 4000.
