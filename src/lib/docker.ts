import Docker from 'dockerode';

const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'
});

export default docker;

export async function pingDocker() {
  try {
    const info = await docker.version();
    return { success: true, version: info };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
