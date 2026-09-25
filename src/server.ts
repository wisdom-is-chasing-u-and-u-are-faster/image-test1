import { app } from './app';
import { serverConfig } from './config';

const server = app.listen(serverConfig.port, () => {
  console.log(`ETMS Core API service listening on port ${serverConfig.port} in ${serverConfig.nodeEnv} mode.`);
});

export default server;
